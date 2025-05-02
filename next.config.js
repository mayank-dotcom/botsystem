/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensures server-side rendering is used
  output: 'standalone',
  
  transpilePackages: ["@langchain/community"],
  eslint: {
    ignoreDuringBuilds: true, // Disables ESLint checks during build
  },
  
  // Add experimental configuration for jsonwebtoken
  experimental: {
    serverComponentsExternalPackages: ['jsonwebtoken']
  },

  // Configure dynamic routes that use request parameters or cookies
  // This prevents Next.js from trying to statically generate these routes
  staticPageGenerationTimeout: 300,
  dynamicParams: true,
  trailingSlash: false,
  distDir: '.next',
};

module.exports = nextConfig
