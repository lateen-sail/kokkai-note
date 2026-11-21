import "@testing-library/jest-dom/vitest";

import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

import { server } from "./src/mocks/server";

// 順番待ちの間隔は、テストごとに3秒の待ちが積み重なるため素通りさせる。順番待ちのテストでは本物に戻す
vi.mock("./src/lib/requestQueue", () => ({
  createRequestQueue: () => ({
    enqueue: <T>(task: () => Promise<T>): Promise<T> => task(),
  }),
}));

beforeAll(() => {
  server.listen({ onUnhandledFrame: "error" });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
