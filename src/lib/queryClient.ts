import { QueryClient } from "@tanstack/react-query";

// 種類ごとの期限は useKokkaiApi の CACHE_POLICY で付ける。
// useKokkaiApi を通さない取得も開くたびに取り直さないよう、短いほうの1日を既定にする（NFR-002）
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
