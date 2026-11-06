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
      Sentry.captureException(error);
    }
  });
}
