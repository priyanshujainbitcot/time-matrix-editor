import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export for Chrome Extension
  output: 'export',
  
  // Disable image optimization (not supported in static export)
  images: {
    unoptimized: true,
  },
  
  // NO asset prefix - we'll fix paths in post-build
  trailingSlash: false,
  
  // Set base path to empty (running from chrome-extension://)
  basePath: '',
  
  // Disable server-side features
  reactStrictMode: true,
  
  // Optimize for production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Use empty turbopack config for Next.js 16
  turbopack: {},
};

export default nextConfig;
