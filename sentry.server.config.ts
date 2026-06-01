import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  enabled: process.env.NODE_ENV === 'production',

  environment: process.env.NODE_ENV,

  // Performance tracing di server
  tracesSampleRate: 0.1,

  release: `kasku@${process.env.NEXT_PUBLIC_APP_VERSION}`,
});
