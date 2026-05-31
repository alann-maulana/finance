/**
 * App version — automatically sourced from `version` in package.json.
 * Injected at build time via `next.config.ts` as NEXT_PUBLIC_APP_VERSION.
 *
 * To update the version, change the `version` field in package.json only.
 */
export const APP_VERSION: string = process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0';
