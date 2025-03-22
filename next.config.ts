import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: '.next',
  // Allow cross-origin requests during development
  allowedDevOrigins: [
    'goldfinch.homelab.myaxel.de'
  ],
};

export default nextConfig;
