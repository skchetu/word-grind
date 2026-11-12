import * as Sentry from "@sentry/nextjs";
import { afterEach, describe, expect, it, vi } from "vitest";

import { reportError } from "./report-error";

const scope = {
  setTags: vi.fn(),
  setContext: vi.fn(),
  setFingerprint: vi.fn(),
};

vi.mock("@sentry/nextjs", () => ({
  withScope: (callback: (s: typeof scope) => void) => callback(scope),
  captureException: vi.fn(),
}));

afterEach(() => vi.clearAllMocks());

describe("reportError", () => {
  it("tags the event by service and reason", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const error = Object.assign(new Error("overloaded"), { status: 529 });
    reportError("claude", "Writing the tip failed", error);
    expect(scope.setTags).toHaveBeenCalledWith({
      service: "claude",
      reason: "outage",
    });
    expect(Sentry.captureException).toHaveBeenCalledWith(error);
  });

  it("titles running out of credit by service", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    reportError(
      "elevenlabs",
      "Recording audio failed",
      new Error('ElevenLabs 401: {"detail":{"status":"quota_exceeded"}}'),
    );
    expect(scope.setFingerprint).toHaveBeenCalledWith(["quota", "elevenlabs"]);
    const [sent] = vi.mocked(Sentry.captureException).mock.calls[0] ?? [];
    expect(sent).toBeInstanceOf(Error);
    expect((sent as Error).message).toBe("Out of credit: ElevenLabs");
  });

  it("wraps a plain Supabase error so its message is the title", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const failure = { message: "permission denied", code: "42501", hint: "" };
    reportError("supabase", "Saving the session failed", failure);
    const [sent] = vi.mocked(Sentry.captureException).mock.calls[0] ?? [];
    expect(sent).toBeInstanceOf(Error);
    expect((sent as Error).message).toBe("permission denied");
    expect((sent as Error).cause).toBe(failure);
  });
});
