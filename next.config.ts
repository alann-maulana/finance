import type { NextConfig } from "next";
import { version } from "./package.json";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Expose package.json version to client-side
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },

  // Remove X-Powered-By header for security
  poweredByHeader: false,

  // Enable React strict mode for catching potential issues
  reactStrictMode: true,

  // Security & service worker headers
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    },
    {
      source: '/sw.js',
      headers: [
        { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
      ],
    },
  ],
};

export default withSentryConfig(nextConfig, {
  // Sentry organization & project slug dari environment variable
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Auth token untuk upload source maps saat build
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Gunakan /api/monitoring sebagai tunnel agar tidak diblokir ad-blocker
  tunnelRoute: "/monitoring",

  // Upload source maps hanya di production build
  sourcemaps: {
    disable: process.env.NODE_ENV !== 'production',
  },

  // Nonaktifkan logging Sentry CLI saat development
  silent: process.env.NODE_ENV !== 'production',

  // Hapus debug logging dari bundle untuk ukuran lebih kecil
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
