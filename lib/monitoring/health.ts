export type HealthResult = {
  status: 200 | 503;
  body: { ok: boolean; database: "up" | "down" };
};

// Runs the database ping and turns its outcome into the response an uptime
// monitor reads: 200 when the database answered, 503 when it failed, threw
// or took too long.
export async function checkHealth(
  ping: () => PromiseLike<{ error: unknown }>,
): Promise<HealthResult> {
  try {
    const { error } = await ping();
    if (!error) return { status: 200, body: { ok: true, database: "up" } };
  } catch {
    // A network failure or timeout counts as down, the same as an error.
  }
  return { status: 503, body: { ok: false, database: "down" } };
}
