import * as Sentry from "@sentry/nextjs";

import { errorReason, type Service } from "./error-reason";

const NAMES: Record<Service, string> = {
  claude: "Claude",
  elevenlabs: "ElevenLabs",
  supabase: "Supabase",
};

// Sends an error the app caught and recovered from (backup list, browser
// voice, no tip) to Sentry, tagged by service and reason, and still logs it
// for the Vercel logs. Running out of credit gets its own title, "Out of
// credit: Claude", which the alert rule and the Gmail filter look for.
export function reportError(service: Service, what: string, error: unknown) {
  const reason = errorReason(error);
  console.error(`${what}:`, error);
  Sentry.withScope((scope) => {
    scope.setTags({ service, reason });
    scope.setContext("failure", { what });
    if (reason === "quota") {
      scope.setFingerprint(["quota", service]);
      Sentry.captureException(
        new Error(`Out of credit: ${NAMES[service]}`, { cause: error }),
      );
    } else {
      Sentry.captureException(asError(error));
    }
  });
}

// Supabase hands back some failures as plain objects ({ message, code,
// hint }). Wrapping them keeps the message as the Sentry issue title instead
// of "Object captured as exception", with the full object kept as the cause.
function asError(error: unknown): unknown {
  if (error instanceof Error) return error;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return new Error(error.message, { cause: error });
  }
  return error;
}
