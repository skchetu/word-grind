import * as Sentry from "@sentry/nextjs";

import { sentryOptions } from "@/lib/monitoring/sentry-options";

export function register() {
  Sentry.init(sentryOptions);
}

// Errors thrown while rendering, in route handlers or in server actions.
export const onRequestError = Sentry.captureRequestError;
