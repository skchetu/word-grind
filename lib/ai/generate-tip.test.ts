import Anthropic from "@anthropic-ai/sdk";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { generateTip } from "./generate-tip";

const MESSAGES_URL = "https://api.anthropic.com/v1/messages";

function messageWith(text: string) {
  return HttpResponse.json({
    id: "msg_test",
    type: "message",
    role: "assistant",
    model: "claude-haiku-5-5",
    content: [{ type: "text", text }],
    stop_reason: "end_turn",
    stop_sequence: null,
    usage: { input_tokens: 40, output_tokens: 15 },
  });
}

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});
afterAll(() => server.close());

// Built after server.listen() so the SDK picks up MSW's fetch.
const testClient = () => new Anthropic({ apiKey: "test-key", maxRetries: 0 });
const mistake = {
  word: "accommodate",
  wrong: "acommodate",
  mnemonic: "room for two c's and two m's",
};

describe("generateTip", () => {
  it("returns Claude's tip, trimmed", async () => {
    server.use(
      http.post(MESSAGES_URL, () =>
        messageWith("  It has room for two c's as well as two m's.\n"),
      ),
    );

    const result = await generateTip(mistake, { client: testClient() });

    expect(result).toEqual({
      tip: "It has room for two c's as well as two m's.",
      source: "claude",
      usage: { inputTokens: 40, outputTokens: 15 },
    });
  });

  it("falls back to the mnemonic when the tip runs long", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    server.use(
      http.post(MESSAGES_URL, () => messageWith("word ".repeat(30).trim())),
    );

    const result = await generateTip(mistake, { client: testClient() });

    expect(result.source).toBe("fallback");
    expect(result.tip).toBe(mistake.mnemonic);
    expect(result.usage.outputTokens).toBe(15); // still billed
  });

  it("falls back to the mnemonic on an API error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(
      http.post(MESSAGES_URL, () =>
        HttpResponse.json(
          { type: "error", error: { type: "api_error", message: "down" } },
          { status: 500 },
        ),
      ),
    );

    const result = await generateTip(mistake, { client: testClient() });

    expect(result).toEqual({
      tip: mistake.mnemonic,
      source: "fallback",
      usage: { inputTokens: 0, outputTokens: 0 },
    });
  });
});
