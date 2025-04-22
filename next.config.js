// import type { NextConfig } from "next";

// const nextConfig: NextConfig = {
//   transpilePackages: ["@langchain/community"]
// };

// export default nextConfig;
/** @type {import('next').NextConfig} */

const nextConfig  = {
  transpilePackages: ["@langchain/community"],
  eslint: {
    ignoreDuringBuilds: true, // Disables ESLint checks during build
  },
  output: "standalone", // Ensures all necessary files are included in the build
};

module.exports = nextConfig;
