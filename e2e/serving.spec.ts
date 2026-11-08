import { expect, test } from "./support/test";

test("[701] 配信のパスの下でアプリが開く", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/kokkai-note\/$/);
  await expect(page.getByRole("heading", { name: "国会ノート" })).toBeVisible();
});
