import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',

  // Disable ESLint during builds (run separately in CI)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript errors during builds (run separately in CI)
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
