import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchMeetingList, fetchSpeeches } from "@/lib/kokkaiClient";
import { findScenario, scenarios, SLOW_RESPONSE_MS } from "@/mocks/scenarios";
import { server } from "@/mocks/server";

afterEach(() => {
  vi.useRealTimers();
});

describe("scenarios", () => {
  it("[1003] empty では、speech が0件を返す", async () => {
    server.use(...scenarios.empty);

    await expect(fetchSpeeches({ any: "物価" })).resolves.toEqual({
      total: 0,
      items: [],
    });
  });

  it("[1003] error では、speech が 400 のエラーを返す", async () => {
    server.use(...scenarios.error);

    await expect(fetchSpeeches({ any: "物価" })).rejects.toMatchObject({
      kind: "badRequest",
      message: "(19011)検索条件の入力に誤りがあります。",
    });
  });

  it("[1003] network では、どのエンドポイントも通信に失敗する", async () => {
    server.use(...scenarios.network);

    await expect(fetchSpeeches({ any: "物価" })).rejects.toMatchObject({
      kind: "network",
    });
    await expect(
      fetchMeetingList({ from: "2026-10-28" }),
    ).rejects.toMatchObject({ kind: "network" });
  });

  it("[1003] slow では、待ってから成功の見本のデータを返す", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    server.use(...scenarios.slow);
    let isSettled = false;

    const page = fetchSpeeches({ any: "物価" }).finally(() => {
      isSettled = true;
    });
    await vi.advanceTimersByTimeAsync(SLOW_RESPONSE_MS - 1);
    expect(isSettled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);

    await expect(page).resolves.toMatchObject({ total: 144750 });
  });

  it("[1003] 名前から場面を選び、知らない名前では何も足さない", () => {
    expect(findScenario("empty")).toBe(scenarios.empty);
    expect(findScenario("unknown")).toEqual([]);
    expect(findScenario(null)).toEqual([]);
  });
});
