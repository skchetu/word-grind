import { describe, expect, it } from "vitest";
import { z } from "zod";

import { errorReason } from "./error-reason";

// Shaped like the Anthropic SDK's APIError, which carries the HTTP status.
function apiError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

describe("errorReason", () => {
  it("spots running out of credit", () => {
    expect(
      errorReason(
        apiError(400, "Your credit balance is too low to access the API."),
      ),
    ).toBe("quota");
    expect(
      errorReason(
        new Error('ElevenLabs 401: {"detail":{"status":"quota_exceeded"}}'),
      ),
    ).toBe("quota");
  });

  it("spots a bad or expired key", () => {
    expect(errorReason(apiError(401, "invalid x-api-key"))).toBe("auth");
    expect(
      errorReason(new Error('ElevenLabs 401: {"detail":"invalid_api_key"}')),
    ).toBe("auth");
    expect(errorReason(apiError(403, "forbidden"))).toBe("auth");
  });

  it("spots rate limits and outages", () => {
    expect(errorReason(apiError(429, "rate limited"))).toBe("rate_limit");
    expect(errorReason(apiError(529, "overloaded"))).toBe("outage");
    expect(errorReason(new Error("ElevenLabs 503: unavailable"))).toBe(
      "outage",
    );
  });

  it("spots a reply that failed its schema", () => {
    const result = z.object({ word: z.string() }).safeParse({});
    expect(result.success).toBe(false);
    expect(errorReason(result.error)).toBe("bad_output");
  });

  it("falls back to other", () => {
    expect(errorReason(new Error("fetch failed"))).toBe("other");
    expect(errorReason({ code: "42501", message: "permission denied" })).toBe(
      "other",
    );
    expect(errorReason("boom")).toBe("other");
  });
});
