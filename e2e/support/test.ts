import path from "node:path";

import { test as base } from "@playwright/test";

const FIXTURES = path.resolve("fixtures");

const API_BASE = "https://kokkai.ndl.go.jp/api";

// 末尾の ? で、meeting が meeting_list に当たらないようにする
const ENDPOINTS = {
  speech: { url: `${API_BASE}/speech?*`, dir: "kokkai/speech" },
  meetingList: {
    url: `${API_BASE}/meeting_list?*`,
    dir: "kokkai/meeting-list",
  },
  meeting: { url: `${API_BASE}/meeting?*`, dir: "kokkai/meeting" },
} as const;

// 国会会議録APIと同じく、ほかのオリジンからの取得を許す
const CORS_HEADERS = { "Access-Control-Allow-Origin": "*" };

type Endpoint = keyof typeof ENDPOINTS;
type Scenario = "success" | "empty" | "error";
type MockApi = (endpoint: Endpoint, scenario: Scenario) => Promise<void>;

export const test = base.extend<{ mockApi: MockApi }>({
  mockApi: [
    async ({ page, baseURL }, use) => {
      const appOrigin = new URL(baseURL ?? "").origin;
      await page.route("**/*", (route) =>
        new URL(route.request().url()).origin === appOrigin
          ? route.fallback()
          : route.abort(),
      );
      const mockApi: MockApi = async (endpoint, scenario) => {
        const { url, dir } = ENDPOINTS[endpoint];
        await page.route(url, (route) =>
          route.fulfill({
            status: scenario === "error" ? 400 : 200,
            headers: CORS_HEADERS,
            path: path.join(FIXTURES, dir, `${scenario}.json`),
          }),
        );
      };
      for (const endpoint of Object.keys(ENDPOINTS) as Endpoint[]) {
        await mockApi(endpoint, "success");
      }
      await use(mockApi);
    },
    { auto: true },
  ],
});

export { expect } from "@playwright/test";
