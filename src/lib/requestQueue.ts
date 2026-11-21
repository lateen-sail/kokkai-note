export type RequestQueueOptions = {
  intervalMs: number;
};

export type RequestQueue = {
  enqueue: <T>(task: () => Promise<T>) => Promise<T>;
};

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, Math.max(ms, 0));
  });

const ignore = (): void => undefined;

// 前のリクエストが終わってから次を始め、応答から intervalMs 以上空ける。失敗した応答も1件として数える
export const createRequestQueue = ({
  intervalMs,
}: RequestQueueOptions): RequestQueue => {
  let tail: Promise<void> = Promise.resolve();
  let lastSettledAt: number | undefined;

  const run = async <T>(task: () => Promise<T>): Promise<T> => {
    if (lastSettledAt !== undefined) {
      await wait(lastSettledAt + intervalMs - Date.now());
    }
    try {
      return await task();
    } finally {
      lastSettledAt = Date.now();
    }
  };

  const enqueue = <T>(task: () => Promise<T>): Promise<T> => {
    const result = tail.then(() => run(task));
    tail = result.then(ignore, ignore);
    return result;
  };

  return { enqueue };
};
