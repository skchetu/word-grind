// Generates a few weekly lists with the real Claude API and reports how
// they turned out. Run by hand (it costs a few cents), never in CI:
//   pnpm eval:week
//
// generateWeek already rejects lists that fail the schema or checkWeek, so
// this measures what those checks can't: how often we end up on a fallback,
// whether difficulty lands near the target, repeats across lists, and cost.
import { generateWeek } from "@/lib/ai/generate-week";
import type { WeekRequest } from "@/lib/ai/prompts";

const REQUESTS: WeekRequest[] = [
  { difficulty: 1, topics: [], avoid: [] },
  { difficulty: 3, topics: ["food", "travel"], avoid: [] },
  { difficulty: 3, topics: ["tech"], avoid: ["accommodate", "rhythm"] },
  { difficulty: 4, topics: ["Korean culture"], avoid: [] },
  { difficulty: 5, topics: ["Indian culture", "music"], avoid: [] },
];

const average = (values: number[]) =>
  values.reduce((sum, v) => sum + v, 0) / Math.max(values.length, 1);

async function main() {
  const seen = new Map<string, number>();
  const rows = [];
  let fallbacks = 0;

  for (const [i, request] of REQUESTS.entries()) {
    const started = Date.now();
    const { week, source, usage } = await generateWeek(request);
    if (source === "fallback") fallbacks++;

    const words = week.words.map((card) => card.word);
    for (const word of words) seen.set(word, (seen.get(word) ?? 0) + 1);

    rows.push({
      run: i + 1,
      target: request.difficulty,
      source,
      words: words.length,
      avgDifficulty: average(week.words.map((c) => c.difficulty)).toFixed(1),
      avoidedOk: request.avoid.every((w) => !words.includes(w)),
      seconds: ((Date.now() - started) / 1000).toFixed(1),
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      theme: week.theme,
    });
  }

  console.table(rows);
  const repeats = [...seen].filter(([, count]) => count > 1).map(([w]) => w);
  console.log(`Fallbacks: ${fallbacks}/${REQUESTS.length}`);
  console.log(`Words in more than one list: ${repeats.join(", ") || "none"}`);
  console.log(
    `Total tokens: ${rows.reduce((s, r) => s + r.inputTokens, 0)} in, ` +
      `${rows.reduce((s, r) => s + r.outputTokens, 0)} out`,
  );

  if (fallbacks > 0 || rows.some((r) => !r.avoidedOk)) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
