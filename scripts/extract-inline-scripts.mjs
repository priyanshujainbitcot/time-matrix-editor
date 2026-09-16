import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outDir = path.join(__dirname, '../out');

console.log('🔧 Extracting inline scripts to external files...');

function extractInlineScripts(htmlPath) {
  let content = fs.readFileSync(htmlPath, 'utf8');
  let scriptCounter = 0;
  let modified = false;

  // Match inline <script> tags (not those with src attribute)
  const inlineScriptRegex = /<script(?![^>]*\ssrc=)([^>]*)>([\s\S]*?)<\/script>/gi;
  
  content = content.replace(inlineScriptRegex, (match, attributes, scriptContent) => {
    // Skip empty scripts
    if (!scriptContent.trim()) {
      return match;
    }

    // Generate unique filename based on content hash
    const hash = crypto.createHash('md5').update(scriptContent).digest('hex').substring(0, 8);
    const scriptFilename = `inline-script-${hash}.js`;
    const scriptPath = path.join(outDir, scriptFilename);

    // Write script content to external file
    fs.writeFileSync(scriptPath, scriptContent, 'utf8');
    
    scriptCounter++;
    modified = true;

    // Return external script tag WITHOUT leading slash
    return `<script src="inline-script-${hash}.js"${attributes}></script>`;
  });

  if (modified) {
    fs.writeFileSync(htmlPath, content, 'utf8');
    console.log(`  ✅ Extracted ${scriptCounter} inline scripts from ${path.basename(htmlPath)}`);
  }

  return scriptCounter;
}

function processHtmlFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let totalExtracted = 0;
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      totalExtracted += processHtmlFiles(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      totalExtracted += extractInlineScripts(fullPath);
    }
  }
  
  return totalExtracted;
}

try {
  const total = processHtmlFiles(outDir);
  console.log(`✅ Total inline scripts extracted: ${total}`);
} catch (error) {
  console.error('❌ Failed to extract inline scripts:', error);
  process.exit(1);
}
