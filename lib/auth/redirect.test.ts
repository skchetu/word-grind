import { describe, expect, it } from "vitest";

import { authRedirect } from "./redirect";

describe("authRedirect", () => {
  it("sends signed-out visitors to the login page", () => {
    expect(authRedirect("/", false)).toBe("/login");
    expect(authRedirect("/drill", false)).toBe("/login");
  });

  it("lets signed-out visitors reach login and the auth callback", () => {
    expect(authRedirect("/login", false)).toBeNull();
    expect(authRedirect("/auth/callback", false)).toBeNull();
  });

  it("does not treat lookalike paths as public", () => {
    expect(authRedirect("/authors", false)).toBe("/login");
  });

  it("sends signed-in users away from the login page", () => {
    expect(authRedirect("/login", true)).toBe("/");
  });

  it("lets signed-in users through everywhere else", () => {
    expect(authRedirect("/", true)).toBeNull();
    expect(authRedirect("/auth/callback", true)).toBeNull();
  });
});
