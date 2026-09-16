import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outDir = path.join(__dirname, '../out');
const manifestSrc = path.join(__dirname, '../public/manifest.json');
const manifestDest = path.join(outDir, 'manifest.json');

console.log('🔧 Post-build script: Copying manifest.json and cleaning up...');

try {
  // Copy manifest.json to out directory
  if (fs.existsSync(manifestSrc)) {
    fs.copyFileSync(manifestSrc, manifestDest);
    console.log('✅ manifest.json copied successfully!');
  } else {
    console.error('❌ manifest.json not found in public directory!');
    process.exit(1);
  }

  // Verify index.html exists
  const indexPath = path.join(outDir, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.error('❌ index.html not found in out directory!');
    process.exit(1);
  }

  // Rename _next to next (Chrome doesn't allow underscore prefixes)
  const nextOldPath = path.join(outDir, '_next');
  const nextNewPath = path.join(outDir, 'next');
  
  if (fs.existsSync(nextOldPath)) {
    console.log('🔄 Renaming _next to next...');
    if (fs.existsSync(nextNewPath)) {
      fs.rmSync(nextNewPath, { recursive: true, force: true });
    }
    fs.renameSync(nextOldPath, nextNewPath);
    console.log('✅ Renamed _next to next');
  }

  // Update all HTML and JS files to use extension-compatible paths
  console.log('🔄 Updating paths for chrome-extension:// protocol...');
  
  function updatePaths(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        updatePaths(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.html') || entry.name.endsWith('.js'))) {
        let content = fs.readFileSync(fullPath, 'utf8');
        const originalContent = content;
        
        // Replace all _next references with next
        content = content.replace(/_next\//g, 'next/');
        
        // Fix paths: Remove leading slash but keep the path
        // This makes them relative to the current directory
        content = content.replace(/href="\/_next\//g, 'href="next/');
        content = content.replace(/src="\/_next\//g, 'src="next/');
        content = content.replace(/href="\/next\//g, 'href="next/');
        content = content.replace(/src="\/next\//g, 'src="next/');
        content = content.replace(/href="\/inline-script-/g, 'href="inline-script-');
        content = content.replace(/src="\/inline-script-/g, 'src="inline-script-');
        
        // Also fix paths in JavaScript strings (Flight data)
        content = content.replace(/"\/next\/static\//g, '"next/static/');
        content = content.replace(/"\.\/next\/static\//g, '"next/static/');
        
        // Remove duplicate meta tags
        content = content.replace(/<meta charSet="utf-8"\/><meta charSet="utf-8"\/>/g, '<meta charSet="utf-8"/>');
        content = content.replace(/<meta name="viewport"[^>]+\/><meta name="viewport"[^>]+\/>/g, '<meta name="viewport" content="width=device-width, initial-scale=1"/>');
        
        if (content !== originalContent) {
          fs.writeFileSync(fullPath, content, 'utf8');
        }
      }
    }
  }
  
  updatePaths(outDir);
  console.log('✅ Updated paths for extension compatibility');

  // Remove all files/folders starting with underscore (Chrome extension restriction)
  console.log('🧹 Cleaning up underscore files and unnecessary folders...');
  
  function removeUnderscoreFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    let removedCount = 0;
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      // Skip the 'next' folder (renamed from _next)
      if (entry.name === 'next' && entry.isDirectory()) {
        // But still clean inside it
        removedCount += removeUnderscoreFiles(fullPath);
        continue;
      }
      
      // Remove anything starting with underscore
      if (entry.name.startsWith('_') || entry.name.startsWith('__')) {
        try {
          if (entry.isDirectory()) {
            fs.rmSync(fullPath, { recursive: true, force: true });
          } else {
            fs.unlinkSync(fullPath);
          }
          removedCount++;
        } catch (err) {
          console.warn(`⚠️  Could not remove ${fullPath}:`, err.message);
        }
      } else if (entry.isDirectory()) {
        // Recursively clean subdirectories
        removedCount += removeUnderscoreFiles(fullPath);
      }
    }
    
    return removedCount;
  }
  
  let underscoreRemoved = removeUnderscoreFiles(outDir);

  // Remove .txt metadata files and unnecessary HTML files
  const additionalCleanup = [
    'index.txt',
    'matrix.txt',
    'notes.txt',
    'tasks.txt',
    '404.html'
  ];

  for (const file of additionalCleanup) {
    const filePath = path.join(outDir, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      underscoreRemoved++;
    }
  }

  // Remove unnecessary subdirectories (matrix, notes, tasks HTML pages - we don't need them for SPA)
  const unnecessaryDirs = ['matrix', 'notes', 'tasks'];
  for (const dir of unnecessaryDirs) {
    const dirPath = path.join(outDir, dir);
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`🗑️  Removed ${dir}/ directory (not needed for SPA)`);
    }
  }

  console.log(`🗑️  Removed ${underscoreRemoved} unnecessary files and folders`);

  // Extract inline scripts to external files (CSP requirement)
  console.log('📦 Extracting inline scripts...');
  execSync('node scripts/extract-inline-scripts.mjs', { 
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });
  
  // Final cleanup - ensure all paths work in extension context
  console.log('🔧 Final path normalization for extension...');
  function finalCleanup(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        finalCleanup(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.html') || entry.name.endsWith('.js'))) {
        let content = fs.readFileSync(fullPath, 'utf8');
        
        // Ensure no double-slashes or leading slashes remain
        content = content.replace(/src="\/\//g, 'src="');
        content = content.replace(/href="\/\//g, 'href="');
        
        // Fix any remaining absolute paths in JS
        content = content.replace(/"\/next\//g, '"next/');
        content = content.replace(/"\.\/next\//g, '"next/');
        
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  }
  
  finalCleanup(outDir);
  console.log('✅ Final cleanup complete');

  console.log('✅ Build complete! Extension is ready in the "out" directory.');
  console.log('📦 Load the "out" folder in chrome://extensions (Developer mode)');
  
} catch (error) {
  console.error('❌ Post-build script failed:', error);
  process.exit(1);
}
