import { expect, test } from "./support/test";

const PAGES = { home: "/" } as const;

test.skip(
  !process.env.CI,
  "基準の画像は CI の Linux で作るため、手元では比べない",
);

for (const [name, path] of Object.entries(PAGES)) {
  test(`[801] [802] ${path} の見た目が基準の画像と同じ @vrt`, async ({
    page,
  }) => {
    await page.goto(path);

    await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
  });
}
