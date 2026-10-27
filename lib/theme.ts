// The colour theme is a per-device choice (a phone and a laptop can differ),
// so it lives in localStorage rather than the database. "system" follows the
// device's light or dark setting.
export const THEMES = ["system", "light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_KEY = "theme";

export function isTheme(value: unknown): value is Theme {
  return THEMES.some((theme) => theme === value);
}

// Runs in <head> before the page paints, so a saved light or dark theme
// never flashes the other one first.
export const themeScript = `try{var t=localStorage.getItem("${THEME_KEY}");if(t==="light"||t==="dark")document.documentElement.classList.add(t)}catch(e){}`;

// Puts the "light" or "dark" class on <html>; "system" leaves neither.
export function applyTheme(root: HTMLElement, theme: Theme) {
  root.classList.remove("light", "dark");
  if (theme !== "system") root.classList.add(theme);
}
