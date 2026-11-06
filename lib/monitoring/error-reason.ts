import { ZodError } from "zod";

export type Service = "claude" | "elevenlabs" | "supabase";

export type Reason =
  | "quota"
  | "auth"
  | "rate_limit"
  | "outage"
  | "bad_output"
  | "other";

// Why a call to Claude, ElevenLabs or Supabase failed, from the error alone,
// so alerts can say "out of credit" instead of a generic error. Running out
// of credit is checked first because ElevenLabs reports it as a 401.
export function errorReason(error: unknown): Reason {
  if (error instanceof ZodError) return "bad_output";
  const message = error instanceof Error ? error.message : String(error);
  if (/credit balance|quota_exceeded/i.test(message)) return "quota";
  const status = statusOf(error, message);
  if (status === 401 || status === 403) return "auth";
  if (status === 429) return "rate_limit";
  if (status !== undefined && status >= 500) return "outage";
  return "other";
}

// The HTTP status: the Anthropic SDK puts it on `status`, and `synthesize`
// starts its message with "ElevenLabs <status>:".
function statusOf(error: unknown, message: string): number | undefined {
  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
  ) {
    return error.status;
  }
  const match = /^ElevenLabs (\d{3})\b/.exec(message);
  return match?.[1] ? Number(match[1]) : undefined;
}
