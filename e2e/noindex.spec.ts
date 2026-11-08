import { expect, test } from "./support/test";

test("[704] HTML に検索から外す指定がある", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    "noindex, nofollow",
  );
});
