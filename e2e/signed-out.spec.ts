import { expect, test } from "@playwright/test";

import { expectNoAxeViolations } from "./a11y";

test("a signed-out visitor is sent to sign in", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  await expectNoAxeViolations(page);
});

test("the health check answers without a session", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ ok: true, database: "up" });
});
