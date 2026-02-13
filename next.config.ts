import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',

  // Disable TypeScript errors during builds (run separately in CI)
  typescript: {
    ignoreBuildErrors: true,
  },

  // Performance optimizations applied:
  // - Reduced notification polling from 60s to 300s
  // - Backend caching for auth and notifications
};

export default withSentryConfig(nextConfig, {
  // Suppress source map upload logs in CI
  silent: true,
  // Disable source map upload (no auth token configured yet)
  sourcemaps: {
    disable: true,
  },
});
