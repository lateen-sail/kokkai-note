import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import type { QueryStatus } from "@tanstack/react-query";
import type { PersistQueryClientOptions } from "@tanstack/react-query-persist-client";
import { del, get, set } from "idb-keyval";

type PersistOptions = {
  key: string;
  shouldPersist: (status: QueryStatus) => boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;

export const PERSIST_KEY = "kokkai-note-cache";

// 保存した結果を残す最長の期間。会議と発言の本文の30日に合わせる（NFR-002）。
// 種類ごとの期限は #14 で staleTime に分ける
export const PERSIST_MAX_AGE_MS = 30 * DAY_MS;

// 失敗や取得中の結果を保存すると、開き直したときに古い失敗を表示し続けるため、成功だけを残す
const PERSIST_OPTIONS: PersistOptions = {
  key: PERSIST_KEY,
  shouldPersist: (status) => status === "success",
};

// Safari などが保存データを消した場合や読めない場合は、ライブラリが保存を破棄し、取得し直す
export const createPersistOptions = (): Omit<
  PersistQueryClientOptions,
  "queryClient"
> => ({
  persister: createAsyncStoragePersister({
    storage: {
      getItem: (key) => get<string>(key),
      setItem: set,
      removeItem: del,
    },
    key: PERSIST_OPTIONS.key,
  }),
  maxAge: PERSIST_MAX_AGE_MS,
  dehydrateOptions: {
    shouldDehydrateQuery: (query) =>
      PERSIST_OPTIONS.shouldPersist(query.state.status),
  },
});
