import { expect, test } from "./support/test";

test("[402] トップの画面を開くとアプリの名前が出る", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "国会ノート" })).toBeVisible();
});

test("[1102] 見本のデータの発言が1件表示される", async ({ page }) => {
  await page.goto("./");

  const latest = page.getByRole("region", { name: "新しい発言" });
  await expect(latest.getByText("藤井比早之", { exact: true })).toBeVisible();
  await expect(latest.getByText(/地方創生を担当する/)).toBeVisible();
  await expect(latest.getByRole("article")).toHaveCount(1);
});
