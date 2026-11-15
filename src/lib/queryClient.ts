import { QueryClient } from "@tanstack/react-query";

// 提供元の負担を小さく保つため、失敗やタブへの復帰で取り直さない。
// 取り直しと保持期間は、順番待ち（#12）と保存（#13、#14）で決める
export const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
    },
  });
