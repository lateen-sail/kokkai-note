import { expect, test } from "./support/test";

test("[801] Noto Sans JP を自分のオリジンから読み込んで本文に使う", async ({
  page,
  baseURL,
}) => {
  const fontResponse = page.waitForResponse(
    (response) =>
      /noto-sans-jp-.*\.woff2$/.test(response.url()) &&
      response.url().startsWith(new URL(baseURL ?? "").origin),
  );
  await page.goto("/");

  expect((await fontResponse).ok()).toBe(true);
  const body = page.locator("body");
  await expect(body).toHaveCSS("font-family", /^"Noto Sans JP"/);
  await expect(body).toHaveCSS("color", "rgb(47, 53, 64)");
});

test("[802] 画面の背景に方眼が表示される", async ({ page }) => {
  await page.goto("/");

  const body = page.locator("body");
  await expect(body).toHaveCSS("background-image", /linear-gradient/);
  await expect(body).toHaveCSS("background-size", /^24px 24px/);
});
