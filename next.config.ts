import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: '.next',
  // Allow cross-origin requests during development
  allowedDevOrigins: [
    'localhost',
    '127.0.0.1'
  ],
};

export default nextConfig;
