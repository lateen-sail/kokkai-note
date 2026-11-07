import path from "node:path";

import { test as base } from "@playwright/test";

const FIXTURES = path.resolve("fixtures");

const ENDPOINTS = {} as const;

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
