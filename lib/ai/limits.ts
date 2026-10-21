// Per-person limits on Claude calls, counted from the ai_calls log over a
// rolling 24 hours. They stop a stuck button, a retry loop or a misbehaving
// client from running up the bill; normal use never gets close.

export type AiFeature = "week" | "tip" | "sentences" | "recap";

export const DAILY_LIMITS: Record<AiFeature, number> = {
  week: 3, // one list a week; extra room for a failed save
  tip: 40, // one per new mistake
  sentences: 40, // one per returning word
  recap: 2, // once after each Sunday test
};

const DAY_MS = 24 * 60 * 60 * 1000;

// The start of the window to count calls from, as an ISO timestamp.
export function limitWindowStart(now: Date = new Date()): string {
  return new Date(now.getTime() - DAY_MS).toISOString();
}

export function isOverLimit(feature: AiFeature, callsInWindow: number) {
  return callsInWindow >= DAILY_LIMITS[feature];
}
