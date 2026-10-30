import { describe, expect, it } from "vitest";

import { shuffle } from "./shuffle";

describe("shuffle", () => {
  it("keeps every item exactly once", () => {
    const items = ["a", "b", "c", "d", "e"];
    expect(shuffle(items).toSorted()).toEqual(items);
  });

  it("doesn't change the original list", () => {
    const items = [1, 2, 3];
    shuffle(items);
    expect(items).toEqual([1, 2, 3]);
  });

  it("reorders with the given random numbers", () => {
    // Always picking index 0 rotates the list.
    expect(shuffle([1, 2, 3, 4], () => 0)).toEqual([2, 3, 4, 1]);
  });
});
