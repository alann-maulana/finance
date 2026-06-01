import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Hanya aktif di production
  enabled: process.env.NODE_ENV === 'production',

  environment: process.env.NODE_ENV,

  // Capture 100% errors, 10% performance traces
  tracesSampleRate: 0.1,

  // Session Replay: 10% session normal, 100% saat error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      // Mask semua text & input secara default untuk privasi
      maskAllText: true,
      blockAllMedia: false,
    }),
  ],

  // Ignore error yang tidak actionable
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    // Network errors yang tidak bisa kita kontrol
    'Network request failed',
    'NetworkError',
    'Failed to fetch',
    'Load failed',
    // Firebase auth cancelled
    'auth/popup-closed-by-user',
    'auth/cancelled-popup-request',
  ],

  // Tambahkan informasi versi app
  release: `kasku@${process.env.NEXT_PUBLIC_APP_VERSION}`,
});
