// The app's top-level tabs, shared by the laptop tab bar and the phone menu.
export const TABS = [
  { href: "/", label: "Home" },
  { href: "/scoreboard", label: "Scoreboard" },
  { href: "/words", label: "Words" },
  { href: "/settings", label: "Settings" },
] as const;

export type TabHref = (typeof TABS)[number]["href"];

function within(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// The tab to highlight for a page. The drill, practice and the test are
// started from Home, so they count as Home.
export function activeTab(pathname: string): TabHref | undefined {
  if (
    pathname === "/" ||
    within(pathname, "/drill") ||
    within(pathname, "/practice") ||
    within(pathname, "/test")
  ) {
    return "/";
  }
  return TABS.find((tab) => tab.href !== "/" && within(pathname, tab.href))
    ?.href;
}

// Signed-out pages (sign in and the magic-link callback) have no tabs.
export function showsNav(pathname: string) {
  return !within(pathname, "/login") && !within(pathname, "/auth");
}
