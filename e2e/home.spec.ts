import { expect, test } from "./support/test";

test("[402] トップの画面を開くとアプリの名前が出る", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "国会ノート" })).toBeVisible();
});
