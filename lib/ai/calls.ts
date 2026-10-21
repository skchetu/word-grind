import type { SupabaseClient } from "@supabase/supabase-js";

import type { TokenUsage } from "./generate-week";
import { isOverLimit, limitWindowStart, type AiFeature } from "./limits";

// Whether this person may make another call for a feature today. Refuses
// if the count itself fails, so an outage can't lift the limit.
export async function canCallClaude(
  supabase: SupabaseClient,
  userId: string,
  feature: AiFeature,
): Promise<boolean> {
  const { count, error } = await supabase
    .from("ai_calls")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", userId)
    .eq("feature", feature)
    .gte("created_at", limitWindowStart());
  return !error && !isOverLimit(feature, count ?? 0);
}

// Records a call in ai_calls. A failed log is reported but never blocks the
// feature that made the call.
export async function logClaudeCall(
  supabase: SupabaseClient,
  call: {
    userId: string;
    feature: AiFeature;
    model: string;
    usage: TokenUsage;
  },
) {
  const { error } = await supabase.from("ai_calls").insert({
    profile_id: call.userId,
    feature: call.feature,
    model: call.model,
    input_tokens: call.usage.inputTokens,
    output_tokens: call.usage.outputTokens,
  });
  if (error) console.error("Logging the AI call failed:", error.message);
}
