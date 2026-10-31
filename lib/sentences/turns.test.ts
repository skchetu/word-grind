import { describe, expect, it } from "vitest";

import { randomTurns } from "./turns";

describe("randomTurns", () => {
  it("gives each word a turn from 0 to 2", () => {
    const turns = randomTurns(["a", "b", "c"], () => 0.99);
    expect([...turns]).toEqual([
      ["a", 2],
      ["b", 2],
      ["c", 2],
    ]);
    expect(randomTurns(["a"], () => 0).get("a")).toBe(0);
  });
});
