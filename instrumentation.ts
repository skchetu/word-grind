import * as Sentry from "@sentry/nextjs";

import { sentryOptions } from "@/lib/monitoring/sentry-options";

export function register() {
  Sentry.init({
    ...sentryOptions,
    // console.warn and console.error also go to Sentry's Logs, so warnings
    // like "Tip rejected" can be searched without the Vercel log viewer.
    integrations: [
      Sentry.consoleLoggingIntegration({ levels: ["warn", "error"] }),
    ],
  });
}

// Errors thrown while rendering, in route handlers or in server actions.
export const onRequestError = Sentry.captureRequestError;
