import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: '.next',
  // Allow cross-origin requests during development
  allowedDevOrigins: [
    'localhost'
  ],
};

export default nextConfig;
