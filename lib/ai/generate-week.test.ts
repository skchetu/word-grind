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
const goodWeek = fallbackWeek(1);

describe("generateWeek", () => {
  it("returns Claude's week when it passes the checks", async () => {
    server.use(http.post(MESSAGES_URL, () => messageWith(goodWeek)));

    const result = await generateWeek(request, { client: testClient() });

    expect(result.source).toBe("claude");
    expect(result.week.theme).toBe(goodWeek.theme);
    expect(result.week.themeNote).toBe(goodWeek.themeNote);
    expect(result.usage).toEqual({ inputTokens: 10, outputTokens: 10 });
  });

  it("keeps a week whose theme note is missing, without a retry", async () => {
    let calls = 0;
    server.use(
      http.post(MESSAGES_URL, () => {
        calls++;
        return messageWith({ ...goodWeek, themeNote: "" });
      }),
    );

    const result = await generateWeek(request, { client: testClient() });

    expect(result.source).toBe("claude");
    expect(result.week.themeNote).toBeUndefined();
    expect(calls).toBe(1);
  });

  it("drops a bad word without another call when 10 good ones remain", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const words = goodWeek.words;
    const oneBad = {
      ...goodWeek,
      words: [
        { ...words[0]!, sentences: ["No word here.", "Nor here."] },
        ...words,
      ],
    };
    let calls = 0;
    server.use(
      http.post(MESSAGES_URL, () => {
        calls++;
        return messageWith(oneBad);
      }),
    );

    const result = await generateWeek(request, { client: testClient() });

    expect(calls).toBe(1);
    expect(result.source).toBe("claude");
    expect(result.week.words.map((c) => c.word)).toEqual(
      words.map((c) => c.word),
    );
  });

  it("asks only for the missing words when too few remain", async () => {
    const words = goodWeek.words;
    const bodies: string[] = [];
    server.use(
      http.post(MESSAGES_URL, async ({ request: req }) => {
        bodies.push(await req.text());
        return bodies.length === 1
          ? messageWith({ ...goodWeek, words: words.slice(0, 6) })
          : messageWith({ words: words.slice(6) });
      }),
    );

    const result = await generateWeek(request, { client: testClient() });

    expect(bodies).toHaveLength(2);
    expect(bodies[1]).toContain("Write 4 more words");
    expect(bodies[1]).toContain(goodWeek.theme);
    expect(result.source).toBe("claude");
    expect(result.week.words).toHaveLength(words.length);
    expect(result.usage).toEqual({ inputTokens: 20, outputTokens: 20 });
  });

  it("falls back when the top-up still leaves too few words", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    let calls = 0;
    server.use(
      http.post(MESSAGES_URL, () => {
        calls++;
        return calls === 1
          ? messageWith({ ...goodWeek, words: goodWeek.words.slice(0, 6) })
          : messageWith({ words: [] });
      }),
    );

    const result = await generateWeek(request, {
      client: testClient(),
      weekNumber: 2,
    });

    expect(calls).toBe(2);
    expect(result).toEqual({
      week: fallbackWeek(2),
      source: "fallback",
      usage: { inputTokens: 20, outputTokens: 20 }, // both calls count
    });
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
    expect(result.usage).toEqual({ inputTokens: 0, outputTokens: 0 });
  });
});

describe("generateWeek with a capitalised word", () => {
  it("accepts it lowercased instead of retrying", async () => {
    const first = goodWeek.words[0]!;
    const shouty = {
      ...goodWeek,
      words: [
        { ...first, word: first.word.toUpperCase() },
        ...goodWeek.words.slice(1),
      ],
    };
    let calls = 0;
    server.use(
      http.post(MESSAGES_URL, () => {
        calls++;
        return messageWith(shouty);
      }),
    );

    const result = await generateWeek(request, { client: testClient() });

    expect(calls).toBe(1);
    expect(result.source).toBe("claude");
    expect(result.week.words[0]?.word).toBe(first.word);
  });
});

describe("fallbackWeek", () => {
  it("rotates through the fallback lists", () => {
    expect(fallbackWeek(0).theme).toBe(fallbackLists[0]?.theme);
    expect(fallbackWeek(1).theme).toBe(fallbackLists[1]?.theme);
    expect(fallbackWeek(2).theme).toBe(fallbackLists[0]?.theme);
  });

  it("cuts a different week from the same list on the next pass", () => {
    const pool = fallbackLists[0]!.words.map((c) => c.word);
    const first = fallbackWeek(0).words.map((c) => c.word);
    const second = fallbackWeek(2).words.map((c) => c.word);
    expect(first).toEqual(pool.slice(0, 10));
    // Starts at word 11 and wraps back to the start of the list.
    expect(second).toEqual([...pool.slice(10), ...pool].slice(0, 10));
  });
});
