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
import fallbackLists from "@/data/fallback-lists.json";
import { fallbackWeek, generateWeek } from "./generate-week";

const MESSAGES_URL = "https://api.anthropic.com/v1/messages";

// A Messages API response whose text is the given JSON, as Claude returns
// structured output.
function messageWith(output: unknown) {
  return HttpResponse.json({
    id: "msg_test",
    type: "message",
    role: "assistant",
    model: "claude-opus-5-5",
    content: [{ type: "text", text: JSON.stringify(output) }],
    stop_reason: "end_turn",
    stop_sequence: null,
    usage: { input_tokens: 10, output_tokens: 10 },
  });
}

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => {
  server.resetHandlers();
  vi.restoreAllMocks();
});
afterAll(() => server.close());

// Built per test, after server.listen(): the SDK keeps the fetch it finds
// at construction, so a client made earlier would bypass MSW. No retries
// inside the SDK, so error cases don't wait on backoff.
const testClient = () => new Anthropic({ apiKey: "test-key", maxRetries: 0 });
const request = { difficulty: 3, topics: ["food"], avoid: [] };
const goodWeek = fallbackLists[1];

describe("generateWeek", () => {
  it("returns Claude's week when it passes the checks", async () => {
    server.use(http.post(MESSAGES_URL, () => messageWith(goodWeek)));

    const result = await generateWeek(request, { client: testClient() });

    expect(result.source).toBe("claude");
    expect(result.week.theme).toBe(goodWeek?.theme);
  });

  it("retries once, then falls back when the week keeps failing checks", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const repeated = {
      ...goodWeek,
      words: [goodWeek!.words[0], ...goodWeek!.words.slice(0, 12)],
    };
    let calls = 0;
    server.use(
      http.post(MESSAGES_URL, () => {
        calls++;
        return messageWith(repeated);
      }),
    );

    const result = await generateWeek(request, {
      client: testClient(),
      weekNumber: 2,
    });

    expect(calls).toBe(2);
    expect(result).toEqual({ week: fallbackWeek(2), source: "fallback" });
  });

  it("falls back straight away on an API error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    let calls = 0;
    server.use(
      http.post(MESSAGES_URL, () => {
        calls++;
        return HttpResponse.json(
          {
            type: "error",
            error: {
              type: "invalid_request_error",
              message: "credit balance is too low",
            },
          },
          { status: 400 },
        );
      }),
    );

    const result = await generateWeek(request, { client: testClient() });

    expect(calls).toBe(1);
    expect(result.source).toBe("fallback");
  });
});

describe("fallbackWeek", () => {
  it("rotates through the fallback lists", () => {
    expect(fallbackWeek(0).theme).toBe(fallbackLists[0]?.theme);
    expect(fallbackWeek(1).theme).toBe(fallbackLists[1]?.theme);
    expect(fallbackWeek(2).theme).toBe(fallbackLists[0]?.theme);
  });
});
