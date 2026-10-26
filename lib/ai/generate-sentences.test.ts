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

import { generateSentences } from "./generate-sentences";

const MESSAGES_URL = "https://api.anthropic.com/v1/messages";

// The SDK reads parsed_output from the text block of a structured reply.
function messageWith(output: unknown) {
  return HttpResponse.json({
    id: "msg_test",
    type: "message",
    role: "assistant",
    model: "claude-haiku-5-5",
    content: [{ type: "text", text: JSON.stringify(output) }],
    stop_reason: "end_turn",
    stop_sequence: null,
    usage: { input_tokens: 60, output_tokens: 30 },
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
const request = {
  words: [
    { word: "laconic", avoid: ["His laconic reply ended the debate."] },
    { word: "ephemeral", avoid: [] },
  ],
  topics: ["food"],
};

describe("generateSentences", () => {
  it("returns a sentence and its cloze for each word", async () => {
    server.use(
      http.post(MESSAGES_URL, () =>
        messageWith({
          sentences: [
            { word: "laconic", sentence: "The laconic chef just nodded." },
            { word: "ephemeral", sentence: " Food trends are ephemeral. " },
          ],
        }),
      ),
    );

    const result = await generateSentences(request, { client: testClient() });

    expect(Object.fromEntries(result.sentences)).toEqual({
      laconic: {
        sentence: "The laconic chef just nodded.",
        cloze: "The ______ chef just nodded.",
      },
      ephemeral: {
        sentence: "Food trends are ephemeral.",
        cloze: "Food trends are ______.",
      },
    });
    expect(result.usage).toEqual({ inputTokens: 60, outputTokens: 30 });
  });

  it("drops repeats, unasked words and sentences missing the word", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    server.use(
      http.post(MESSAGES_URL, () =>
        messageWith({
          sentences: [
            {
              word: "laconic",
              sentence: "His laconic reply ended the debate.",
            },
            { word: "ephemeral", sentence: "Fame is fleeting." },
            { word: "ubiquitous", sentence: "Phones are ubiquitous." },
          ],
        }),
      ),
    );

    const result = await generateSentences(request, { client: testClient() });

    expect(result.sentences.size).toBe(0);
    expect(result.usage.outputTokens).toBe(30); // still billed
  });

  it("returns no sentences on an API error", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(
      http.post(MESSAGES_URL, () =>
        HttpResponse.json(
          { type: "error", error: { type: "api_error", message: "down" } },
          { status: 500 },
        ),
      ),
    );

    const result = await generateSentences(request, { client: testClient() });

    expect(result.sentences.size).toBe(0);
    expect(result.usage).toEqual({ inputTokens: 0, outputTokens: 0 });
  });

  it("makes no call when no words need a sentence", async () => {
    const result = await generateSentences(
      { words: [], topics: [] },
      { client: testClient() },
    );
    expect(result.sentences.size).toBe(0);
  });
});
