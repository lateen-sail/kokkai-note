import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createRequestQueue } from "@/lib/requestQueue";

// vitest.setup.ts で素通りさせている順番待ちを、本物に戻す
vi.unmock("@/lib/requestQueue");

const INTERVAL_MS = 3000;
const RESPONSE_MS = 500;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "performance"] });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("createRequestQueue", () => {
  it("[1201] 最初のリクエストは待たずに送る", async () => {
    const queue = createRequestQueue({ intervalMs: INTERVAL_MS });
    const task = vi.fn(() => Promise.resolve("A"));

    const result = queue.enqueue(task);
    await vi.advanceTimersByTimeAsync(0);

    expect(task).toHaveBeenCalledTimes(1);
    await expect(result).resolves.toBe("A");
  });

  it("[1201] 同時に頼んでも、前の応答が返るまで次を送らない", async () => {
    const queue = createRequestQueue({ intervalMs: INTERVAL_MS });
    // 応答が返らないままのリクエスト
    const taskA = vi.fn(() => new Promise<string>(() => undefined));
    const taskB = vi.fn(() => Promise.resolve("B"));

    void queue.enqueue(taskA);
    void queue.enqueue(taskB);
    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 2);

    expect(taskA).toHaveBeenCalledTimes(1);
    expect(taskB).not.toHaveBeenCalled();
  });

  it("[1201] 前の応答から intervalMs 以上空けて次を送る", async () => {
    const queue = createRequestQueue({ intervalMs: INTERVAL_MS });
    const taskA = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          setTimeout(() => {
            resolve("A");
          }, RESPONSE_MS);
        }),
    );
    const taskB = vi.fn(() => Promise.resolve("B"));

    const resultA = queue.enqueue(taskA);
    const resultB = queue.enqueue(taskB);
    await vi.advanceTimersByTimeAsync(RESPONSE_MS);
    await expect(resultA).resolves.toBe("A");

    await vi.advanceTimersByTimeAsync(INTERVAL_MS - 1);
    expect(taskB).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);

    expect(taskB).toHaveBeenCalledTimes(1);
    await expect(resultB).resolves.toBe("B");
  });

  it("[1201] 前の応答から intervalMs 以上たっていれば、待たずに送る", async () => {
    const queue = createRequestQueue({ intervalMs: INTERVAL_MS });
    await queue.enqueue(() => Promise.resolve("A"));
    await vi.advanceTimersByTimeAsync(INTERVAL_MS);
    const taskB = vi.fn(() => Promise.resolve("B"));

    void queue.enqueue(taskB);
    await vi.advanceTimersByTimeAsync(0);

    expect(taskB).toHaveBeenCalledTimes(1);
  });

  it("[1201] 失敗しても、間隔を空けて次を送る", async () => {
    const queue = createRequestQueue({ intervalMs: INTERVAL_MS });
    const error = new Error("失敗");
    const taskB = vi.fn(() => Promise.resolve("B"));

    const resultA = queue.enqueue(() => Promise.reject(error));
    const resultB = queue.enqueue(taskB);
    await expect(resultA).rejects.toBe(error);

    await vi.advanceTimersByTimeAsync(INTERVAL_MS - 1);
    expect(taskB).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);

    await expect(resultB).resolves.toBe("B");
  });

  it("[1201] 頼んだ順に送る", async () => {
    const queue = createRequestQueue({ intervalMs: INTERVAL_MS });
    const sent: string[] = [];
    const task = (name: string) => () => {
      sent.push(name);
      return Promise.resolve(name);
    };

    const results = Promise.all([
      queue.enqueue(task("A")),
      queue.enqueue(task("B")),
      queue.enqueue(task("C")),
    ]);
    await vi.advanceTimersByTimeAsync(INTERVAL_MS * 2);

    await expect(results).resolves.toEqual(["A", "B", "C"]);
    expect(sent).toEqual(["A", "B", "C"]);
  });
});
