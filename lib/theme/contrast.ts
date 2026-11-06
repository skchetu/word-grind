// WCAG 2 contrast for the theme's OKLCH tokens, so a colour change can't
// quietly make text or controls hard to see. Pure maths, no DOM.

export type Oklch = { l: number; c: number; h: number; alpha: number };

// Parses `oklch(0.5 0.2 290)` or `oklch(1 0 0 / 15%)`.
export function parseOklch(value: string): Oklch {
  const match =
    /oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)(%?))?\s*\)/.exec(
      value,
    );
  if (!match) throw new Error(`Not an oklch() colour: ${value}`);
  const [, l, c, h, a, percent] = match;
  const alpha = a === undefined ? 1 : Number(a) / (percent ? 100 : 1);
  return { l: Number(l), c: Number(c), h: Number(h), alpha };
}

type Rgb = [number, number, number]; // linear sRGB, 0 to 1

// OKLCH to linear sRGB, via OKLab (Björn Ottosson's matrices), clipped to
// the sRGB gamut the way browsers display it.
function toLinearRgb({ l, c, h }: Oklch): Rgb {
  const a = c * Math.cos((h * Math.PI) / 180);
  const b = c * Math.sin((h * Math.PI) / 180);
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const clip = (x: number) => Math.min(1, Math.max(0, x));
  return [
    clip(4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_),
    clip(-1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_),
    clip(-0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_),
  ];
}

const toGamma = (x: number) =>
  x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
const toLinear = (x: number) =>
  x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;

// A see-through colour as it looks over `under`, blended in gamma sRGB like
// the browser does.
function over(top: Oklch, under: Rgb): Rgb {
  const rgb = toLinearRgb(top);
  return rgb.map((x, i) =>
    toLinear(top.alpha * toGamma(x) + (1 - top.alpha) * toGamma(under[i] ?? 0)),
  ) as Rgb;
}

const luminance = ([r, g, b]: Rgb) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

// The WCAG contrast ratio, 1 to 21, of `fg` shown on `bg`.
export function contrastRatio(fg: string, bg: string): number {
  const back = toLinearRgb(parseOklch(bg));
  const a = luminance(over(parseOklch(fg), back));
  const b = luminance(back);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

// The custom properties in a block of CSS, as name to value.
export function readTokens(css: string): Map<string, string> {
  const tokens = new Map<string, string>();
  for (const [, name, value] of css.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
    if (name && value) tokens.set(name, value.trim());
  }
  return tokens;
}
