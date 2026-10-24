// The Sunday test gets one hour for the whole list, not a limit per word.
export const TEST_MS = 60 * 60 * 1000;

// The clock turns red for the last five minutes.
export const LOW_MS = 5 * 60 * 1000;

// Time left, worked out from the start time rather than by counting ticks,
// so a phone that pauses timers in a background tab still ends on time.
export function msLeft(startedAt: number, now: number, limit = TEST_MS) {
  return Math.max(0, limit - (now - startedAt));
}

// "59:07". Rounds up, so the clock only reads 0:00 once time is really up.
export function formatClock(ms: number) {
  const seconds = Math.ceil(ms / 1000);
  const m = Math.floor(seconds / 60);
  return `${m}:${String(seconds % 60).padStart(2, "0")}`;
}
