import { expect, test } from "./support/test";

type VrtPage = { taskId: string; name: string; path: string };

// 画面を完成させる Issue で足す。作っている途中の画面は足さない
const PAGES: VrtPage[] = [];

test.skip(
  !process.env.CI,
  "基準の画像は CI の Linux で作るため、手元では比べない",
);

for (const { taskId, name, path } of PAGES) {
  test(`[${taskId}] ${path} の見た目が基準の画像と同じ @vrt`, async ({
    page,
  }) => {
    await page.goto(path);

    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
  });
}
