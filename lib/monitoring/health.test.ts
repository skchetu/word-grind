import { describe, expect, it } from "vitest";

import { checkHealth } from "./health";

describe("checkHealth", () => {
  it("returns 200 when the database answers", async () => {
    const result = await checkHealth(async () => ({ error: null }));
    expect(result).toEqual({ status: 200, body: { ok: true, database: "up" } });
  });

  it("returns 503 when the query reports an error", async () => {
    const result = await checkHealth(async () => ({
      error: { message: "project paused" },
    }));
    expect(result).toEqual({
      status: 503,
      body: { ok: false, database: "down" },
    });
  });

  it("returns 503 when the query throws, such as on a timeout", async () => {
    const result = await checkHealth(async () => {
      throw new DOMException("The operation timed out.", "TimeoutError");
    });
    expect(result.status).toBe(503);
  });
});
