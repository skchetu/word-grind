import { describe, expect, it } from "vitest";
import { checkWeek, weekSchema } from "@/lib/ai/schemas";
import fallbackLists from "./fallback-lists.json";

// The fallback lists are used when Claude fails, so they must pass the
// same validation as a generated week.
describe("fallback lists", () => {
  it("has at least one list", () => {
    expect(fallbackLists.length).toBeGreaterThan(0);
  });

  it.each(fallbackLists.map((list, i) => [i + 1, list] as const))(
    "list %i passes the schema and the week checks",
    (_, list) => {
      const week = weekSchema.parse(list);
      expect(checkWeek(week)).toEqual([]);
    },
  );
});
