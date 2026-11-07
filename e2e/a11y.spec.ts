import AxeBuilder from "@axe-core/playwright";

import { expect, test } from "./support/test";

const pages = ["/"];

for (const path of pages) {
  test(`[403] ${path} は WCAG 2.2 AA を満たす @a11y`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(results.violations).toEqual([]);
  });
}
