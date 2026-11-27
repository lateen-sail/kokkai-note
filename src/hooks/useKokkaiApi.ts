import {
  type QueryKey,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";

export type QueryKind =
  "meeting" | "speechSearch" | "speechCount" | "meetingList";

type CachePolicy = Record<QueryKind, { staleTimeMs: number }>;

type UseKokkaiApiParams<TData> = {
  kind: QueryKind;
  queryKey: QueryKey;
  queryFn: () => Promise<TData>;
};

const DAY_MS = 24 * 60 * 60 * 1000;

// 会議の本文は後から変わらないため長く、検索結果、件数、会議一覧は新しい会議で変わるため1日にする（NFR-002）
export const CACHE_POLICY: CachePolicy = {
  meeting: { staleTimeMs: 30 * DAY_MS },
  speechSearch: { staleTimeMs: DAY_MS },
  speechCount: { staleTimeMs: DAY_MS },
  meetingList: { staleTimeMs: DAY_MS },
};

export const useKokkaiApi = <TData>({
  kind,
  queryKey,
  queryFn,
}: UseKokkaiApiParams<TData>): UseQueryResult<TData> =>
  useQuery({
    queryKey,
    queryFn,
    staleTime: CACHE_POLICY[kind].staleTimeMs,
  });
