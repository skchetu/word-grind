import { expect, test } from "@playwright/test";

import { expectNoAxeViolations } from "./a11y";
import { AUTH_FILE } from "./env";

test.use({ storageState: AUTH_FILE });

test("the first visit of the week makes a 10-word list", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Today", exact: true }),
  ).toBeVisible();
  // With Claude unreachable, the curated fallback list is saved instead.
  await expect(
    page.getByRole("heading", { name: "This week · 10 words" }),
  ).toBeVisible({ timeout: 30_000 });
  await expect(
    page.getByRole("heading", { name: "Today's drill" }),
  ).toBeVisible();
  await expectNoAxeViolations(page);
});
