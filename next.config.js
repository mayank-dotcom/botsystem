/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove any 'output: "export"' if it exists
  // Add this to ensure server-side rendering is used
  output: 'standalone',
  
  transpilePackages: ["@langchain/community"],
  eslint: {
    ignoreDuringBuilds: true, // Disables ESLint checks during build
  },
  output: "standalone", // Ensures all necessary files are included in the build
};

module.exports = nextConfig
