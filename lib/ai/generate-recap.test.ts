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

import { generateRecap } from "./generate-recap";
import { buildRecapRequest } from "./prompts";

const MESSAGES_URL = "https://api.anthropic.com/v1/messages";

// The SDK reads parsed_output from the text block of a structured reply.
function messageWith(output: unknown) {
  return HttpResponse.json({
    id: "msg_test",
    type: "message",
    role: "assistant",
    model: "claude-sonnet-5-5",
    content: [{ type: "text", text: JSON.stringify(output) }],
    stop_reason: "end_turn",
    stop_sequence: null,
    usage: { input_tokens: 120, output_tokens: 60 },
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
const players = [
  {
    name: "Alex",
    score: 9,
    total: 10,
    misses: [{ word: "accommodate", typed: "acommodate" }],
  },
  { name: "Sam", score: 10, total: 10, misses: [] },
];

describe("buildRecapRequest", () => {
  it("lists each person's score and misses", () => {
    expect(buildRecapRequest(players)).toBe(
      'Alex: 9/10. Misses: accommodate (typed "acommodate")\nSam: 10/10. Misses: none',
    );
  });
});

describe("generateRecap", () => {
  it("returns Claude's recap, trimmed", async () => {
    server.use(
      http.post(MESSAGES_URL, () =>
        messageWith({
          headline: " Sam wins with a perfect 10! ",
          sharedPatterns: ["doubled consonants"],
          nextWeekFocus: ["double c and double m"],
        }),
      ),
    );

    const result = await generateRecap(players, { client: testClient() });

    expect(result).toEqual({
      recap: {
        headline: "Sam wins with a perfect 10!",
        sharedPatterns: ["doubled consonants"],
        nextWeekFocus: ["double c and double m"],
      },
      usage: { inputTokens: 120, outputTokens: 60 },
    });
  });

  it("returns no recap when the reply doesn't fit the schema", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(
      http.post(MESSAGES_URL, () =>
        messageWith({ headline: "", sharedPatterns: [], nextWeekFocus: [] }),
      ),
    );

    const result = await generateRecap(players, { client: testClient() });

    expect(result.recap).toBeNull();
  });

  it("returns no recap on an API error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(
      http.post(MESSAGES_URL, () =>
        HttpResponse.json(
          { type: "error", error: { type: "api_error", message: "down" } },
          { status: 500 },
        ),
      ),
    );

    const result = await generateRecap(players, { client: testClient() });

    expect(result).toEqual({
      recap: null,
      usage: { inputTokens: 0, outputTokens: 0 },
    });
  });
});
