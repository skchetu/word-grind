import { describe, expect, it } from "vitest";

import { activeTab, showsNav } from "./nav";

describe("activeTab", () => {
  it("highlights Home on the home page, the drill, practice and the test", () => {
    expect(activeTab("/")).toBe("/");
    expect(activeTab("/drill")).toBe("/");
    expect(activeTab("/practice")).toBe("/");
    expect(activeTab("/test/2026-10-19")).toBe("/");
  });

  it("highlights a tab on its own pages and the pages under it", () => {
    expect(activeTab("/scoreboard")).toBe("/scoreboard");
    expect(activeTab("/words/accommodate")).toBe("/words");
    expect(activeTab("/settings")).toBe("/settings");
  });

  it("doesn't match a page that only shares the start of a name", () => {
    expect(activeTab("/wordsmith")).toBeUndefined();
  });
});

describe("showsNav", () => {
  it("hides the tabs on signed-out pages", () => {
    expect(showsNav("/login")).toBe(false);
    expect(showsNav("/auth/callback")).toBe(false);
    expect(showsNav("/scoreboard")).toBe(true);
  });
});
