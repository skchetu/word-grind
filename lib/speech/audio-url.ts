import { publicEnv } from "@/lib/env";

export const AUDIO_BUCKET = "word-audio";

// The public URL of a recorded clip, or undefined when there's no clip and
// the browser voice should read the text instead.
export function audioUrl(
  path: string | null | undefined,
  supabaseUrl = publicEnv().NEXT_PUBLIC_SUPABASE_URL,
): string | undefined {
  if (!path) return undefined;
  const base = supabaseUrl.replace(/\/+$/, "");
  return `${base}/storage/v1/object/public/${AUDIO_BUCKET}/${path}`;
}
