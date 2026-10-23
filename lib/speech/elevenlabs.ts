// Server only: reads ELEVENLABS_API_KEY. Never import this from a client
// component.

export const TTS_MODEL = "eleven_flash_v2_5";
const API = "https://api.elevenlabs.io/v1/text-to-speech";

export type ElevenLabsConfig = { apiKey: string; voiceId: string };

// The key and voice from the environment, or null when either is missing,
// in which case the app keeps using the browser voice.
export function elevenLabsConfig(
  env: Record<string, string | undefined> = process.env,
): ElevenLabsConfig | null {
  const apiKey = env.ELEVENLABS_API_KEY?.trim();
  const voiceId = env.ELEVENLABS_VOICE_ID?.trim();
  return apiKey && voiceId ? { apiKey, voiceId } : null;
}

// One MP3 of `text` read by the configured voice. Throws on any API error;
// callers treat a failed clip as "no clip" and fall back to the browser.
export async function synthesize(
  text: string,
  { apiKey, voiceId }: ElevenLabsConfig,
): Promise<ArrayBuffer> {
  const response = await fetch(
    `${API}/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "content-type": "application/json",
        accept: "audio/mpeg",
      },
      body: JSON.stringify({ text, model_id: TTS_MODEL }),
    },
  );
  if (!response.ok) {
    // The body explains the failure (bad key, out of credit) without
    // echoing the key back.
    const detail = (await response.text()).slice(0, 200);
    throw new Error(`ElevenLabs ${response.status}: ${detail}`);
  }
  return response.arrayBuffer();
}
