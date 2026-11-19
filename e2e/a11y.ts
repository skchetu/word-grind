import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

// Fails the test on any WCAG A or AA violation axe can detect on the page.
export async function expectNoAxeViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    violations.map(
      (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
    ),
  ).toEqual([]);
}
