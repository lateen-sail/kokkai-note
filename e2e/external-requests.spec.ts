import { expect, test } from "./support/test";

const EXTERNAL_URL = "https://example.com/";

test("[404] アプリ以外のオリジンへのリクエストを止める", async ({ page }) => {
  await page.goto("/");

  const failedRequest = page.waitForEvent("requestfailed", {
    predicate: (request) => request.url() === EXTERNAL_URL,
    timeout: 5_000,
  });
  await page.evaluate(async (url) => {
    await fetch(url, { mode: "no-cors" }).catch(() => undefined);
  }, EXTERNAL_URL);

  // 止めたときだけ ERR_FAILED になる。DNS の失敗などとは errorText で分かる
  expect((await failedRequest).failure()?.errorText).toBe("net::ERR_FAILED");
});
