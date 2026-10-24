import { describe, expect, it } from "vitest";
import { checkWeek, fallbackPoolSchema } from "@/lib/ai/schemas";
import fallbackLists from "./fallback-lists.json";

// The fallback lists are used when Claude fails, so every word must pass
// the same checks as a generated week.
describe("fallback lists", () => {
  it("has at least one list", () => {
    expect(fallbackLists.length).toBeGreaterThan(0);
  });

  it.each(fallbackLists.map((list, i) => [i + 1, list] as const))(
    "list %i passes the schema and the word checks",
    (_, list) => {
      const pool = fallbackPoolSchema.parse(list);
      expect(checkWeek(pool)).toEqual([]);
    },
  );
});
