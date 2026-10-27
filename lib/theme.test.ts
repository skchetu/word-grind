import { describe, expect, it } from "vitest";

import { applyTheme, isTheme } from "./theme";

describe("isTheme", () => {
  it("accepts the three themes and nothing else", () => {
    expect(isTheme("system")).toBe(true);
    expect(isTheme("dark")).toBe(true);
    expect(isTheme("blue")).toBe(false);
    expect(isTheme(null)).toBe(false);
  });
});

describe("applyTheme", () => {
  it("swaps the class and clears it for system", () => {
    const root = { classList: new Set<string>() };
    const el = {
      classList: {
        add: (c: string) => root.classList.add(c),
        remove: (...cs: string[]) =>
          cs.forEach((c) => root.classList.delete(c)),
      },
    } as unknown as HTMLElement;

    applyTheme(el, "dark");
    expect([...root.classList]).toEqual(["dark"]);
    applyTheme(el, "light");
    expect([...root.classList]).toEqual(["light"]);
    applyTheme(el, "system");
    expect([...root.classList]).toEqual([]);
  });
});
