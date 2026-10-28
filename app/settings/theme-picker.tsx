"use client";

import { useSyncExternalStore } from "react";

import {
  applyTheme,
  isTheme,
  THEME_KEY,
  THEMES,
  type Theme,
} from "@/lib/theme";

const LABELS: Record<Theme, string> = {
  system: "Match this device",
  light: "Light",
  dark: "Dark",
};

function savedTheme(): Theme {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return isTheme(value) ? value : "system";
  } catch {
    return "system";
  }
}

const listeners = new Set<() => void>();
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Saved on this device only, and applied straight away without a reload.
export function ThemePicker() {
  const theme = useSyncExternalStore(subscribe, savedTheme, () => "system");

  function choose(next: Theme) {
    try {
      if (next === "system") localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, next);
    } catch {
      // Storage can be blocked (private browsing); the theme still applies.
    }
    applyTheme(document.documentElement, next);
    listeners.forEach((listener) => listener());
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <label htmlFor="theme" className="text-sm font-medium">
        Theme
      </label>
      <select
        id="theme"
        value={theme}
        onChange={(event) => {
          if (isTheme(event.target.value)) choose(event.target.value);
        }}
        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
      >
        {THEMES.map((option) => (
          <option key={option} value={option}>
            {LABELS[option]}
          </option>
        ))}
      </select>
    </div>
  );
}
