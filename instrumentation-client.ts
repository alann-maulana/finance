import * as Sentry from '@sentry/nextjs';
import './sentry.client.config';

// Instrument client-side navigations untuk tracing
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
