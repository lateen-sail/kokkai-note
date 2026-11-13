import { readFile } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "./support/test";

const API_BASE = "https://kokkai.ndl.go.jp/api";

const readFixture = async (dir: string): Promise<unknown> =>
  JSON.parse(
    await readFile(path.resolve("fixtures", dir, "success.json"), "utf8"),
  );

test("[1005] 本番のビルドでは、?mock を付けても MSW が動かない", async ({
  page,
  context,
}) => {
  const scripts: Promise<string>[] = [];
  page.on("response", (response) => {
    if (response.request().resourceType() === "script") {
      scripts.push(response.text());
    }
  });

  await page.goto("./?mock=empty");
  await expect(page.getByRole("heading", { name: "国会ノート" })).toBeVisible();

  expect(context.serviceWorkers()).toHaveLength(0);
  expect(scripts.length).toBeGreaterThan(0);
  for (const script of await Promise.all(scripts)) {
    expect(script).not.toContain("mockServiceWorker");
  }
});

for (const { endpoint, dir } of [
  { endpoint: "speech?any=物価", dir: "kokkai/speech" },
  { endpoint: "meeting_list?from=2026-10-28", dir: "kokkai/meeting-list" },
  { endpoint: "meeting?issueID=122204024X00720261106", dir: "kokkai/meeting" },
]) {
  test(`[1006] ${endpoint} に、同じ見本のデータが自動で返る`, async ({
    page,
  }) => {
    await page.goto("./");

    const body = await page.evaluate(async (url) => {
      const response = await fetch(url);
      return await response.json();
    }, `${API_BASE}/${endpoint}&recordPacking=json`);

    expect(body).toEqual(await readFixture(dir));
  });
}
