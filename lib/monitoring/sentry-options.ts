// Options shared by the browser, server and edge Sentry setups. Sentry only
// runs on Vercel (production and previews), so `pnpm dev` and tests send
// nothing. sendDefaultPii stays off: events carry the user's id, never
// their email or IP address.
export const sentryOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_VERCEL_ENV),
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV,
  sendDefaultPii: false,
  // Noise that isn't a bug: aborted fetches, iOS blocking audio until a
  // tap, and a harmless browser layout warning.
  ignoreErrors: [
    "AbortError",
    "NotAllowedError",
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
  ],
};
