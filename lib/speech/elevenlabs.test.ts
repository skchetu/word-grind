import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { elevenLabsConfig, synthesize, TTS_MODEL } from "./elevenlabs";

const URL = "https://api.elevenlabs.io/v1/text-to-speech/:voiceId";
const config = { apiKey: "test-key", voiceId: "voice-1" };

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("elevenLabsConfig", () => {
  it("needs both the key and the voice", () => {
    expect(elevenLabsConfig({})).toBeNull();
    expect(elevenLabsConfig({ ELEVENLABS_API_KEY: "k" })).toBeNull();
    expect(
      elevenLabsConfig({ ELEVENLABS_API_KEY: " k ", ELEVENLABS_VOICE_ID: "v" }),
    ).toEqual({ apiKey: "k", voiceId: "v" });
  });
});

describe("synthesize", () => {
  it("posts the text and returns the MP3 bytes", async () => {
    let seen:
      | {
          voiceId: unknown;
          key: string | null;
          body: unknown;
          format: string | null;
        }
      | undefined;
    server.use(
      http.post(URL, async ({ request, params }) => {
        seen = {
          voiceId: params.voiceId,
          key: request.headers.get("xi-api-key"),
          body: await request.json(),
          format: new globalThis.URL(request.url).searchParams.get(
            "output_format",
          ),
        };
        return new HttpResponse(new Uint8Array([1, 2, 3]), {
          headers: { "content-type": "audio/mpeg" },
        });
      }),
    );

    const audio = await synthesize("laconic", config);

    expect(new Uint8Array(audio)).toEqual(new Uint8Array([1, 2, 3]));
    expect(seen).toEqual({
      voiceId: "voice-1",
      key: "test-key",
      body: { text: "laconic", model_id: TTS_MODEL },
      format: "mp3_44100_128",
    });
  });

  it("throws with the status on an API error", async () => {
    server.use(
      http.post(URL, () =>
        HttpResponse.json({ detail: "quota_exceeded" }, { status: 401 }),
      ),
    );
    await expect(synthesize("laconic", config)).rejects.toThrow(
      /ElevenLabs 401: .*quota_exceeded/,
    );
  });
});
