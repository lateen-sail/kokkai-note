import { QueryClient } from "@tanstack/react-query";

// 検索結果、件数、会議一覧の期限の1日を、種類を分けるまでの共通の期限にする（NFR-002）。
// 種類ごとの期限は #14 で分ける
const DEFAULT_STALE_TIME_MS = 24 * 60 * 60 * 1000;

// 提供元の負担を小さく保つため、失敗やタブへの復帰で取り直さない。
// gcTime が保存の期間の30日より短いと、保存した結果が先に捨てられる。
// setTimeout は約24.8日を超える値を1ミリ秒として扱うため、30日ではなく Infinity にする
export const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: DEFAULT_STALE_TIME_MS,
        gcTime: Infinity,
      },
    },
  });
