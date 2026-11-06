import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { contrastRatio, parseOklch, readTokens } from "./contrast";

describe("contrastRatio", () => {
  it("matches WCAG's figures for black, white and grey", () => {
    expect(contrastRatio("oklch(0 0 0)", "oklch(1 0 0)")).toBeCloseTo(21, 1);
    expect(contrastRatio("oklch(1 0 0)", "oklch(1 0 0)")).toBeCloseTo(1, 5);
    // #767676 on white is the classic 4.54:1.
    expect(contrastRatio("oklch(0.5658 0 0)", "oklch(1 0 0)")).toBeCloseTo(
      4.54,
      1,
    );
  });

  it("blends a see-through colour with what's under it", () => {
    expect(parseOklch("oklch(1 0 0 / 15%)").alpha).toBe(0.15);
    expect(contrastRatio("oklch(1 0 0 / 0%)", "oklch(0 0 0)")).toBeCloseTo(
      1,
      5,
    );
  });
});

// The tokens from app/globals.css: the first :root block is light, the block
// inside `@variant dark` is dark and inherits anything it doesn't set.
const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
const lightStart = css.indexOf(":root {");
const lightCss = css.slice(lightStart, css.indexOf("}", lightStart));
const darkStart = css.indexOf("@variant dark {");
const darkCss = css.slice(darkStart, css.indexOf("}", darkStart));
const light = readTokens(lightCss);
const themes = {
  light,
  dark: new Map([...light, ...readTokens(darkCss)]),
};

// Text needs 4.5:1 (WCAG 1.4.3); focus rings, chart marks and other
// non-text parts need 3:1 (WCAG 1.4.11). Only pairs the app shows are
// listed: hint text never sits on a bg-muted fill, for example.
const TEXT = 4.5;
const MARK = 3;
const pairs: [fg: string, bg: string, min: number][] = [
  ["foreground", "background", TEXT],
  ["card-foreground", "card", TEXT],
  ["popover-foreground", "popover", TEXT],
  ["primary-foreground", "primary", TEXT],
  ["secondary-foreground", "secondary", TEXT],
  ["accent-foreground", "accent", TEXT],
  ["muted-foreground", "background", TEXT],
  ["muted-foreground", "card", TEXT],
  ["success", "card", TEXT],
  ["warning", "card", TEXT],
  ["danger", "card", TEXT],
  ["ring", "background", MARK],
  ["ring", "card", MARK],
  ["primary", "background", MARK],
  ["player-1", "card", MARK],
  ["player-2", "card", MARK],
  ["highlight-foreground", "highlight", TEXT],
  ["highlight", "background", MARK],
  ["highlight", "card", MARK],
];

describe.each(Object.entries(themes))("%s theme", (_, tokens) => {
  it.each(pairs)("%s on %s reaches %s:1", (fg, bg, min) => {
    const fore = tokens.get(fg);
    const back = tokens.get(bg);
    expect(fore, `--${fg}`).toBeDefined();
    expect(back, `--${bg}`).toBeDefined();
    expect(contrastRatio(fore ?? "", back ?? "")).toBeGreaterThanOrEqual(min);
  });
});
