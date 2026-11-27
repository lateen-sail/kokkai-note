import { QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  CACHE_POLICY,
  type QueryKind,
  useKokkaiApi,
} from "@/hooks/useKokkaiApi";
import { createQueryClient } from "@/lib/queryClient";

const DAY_MS = 24 * 60 * 60 * 1000;
// 期限の前後を、時計のずれに左右されない幅で確かめる
const MARGIN_MS = 60_000;

const renderWithSavedData = ({
  kind,
  savedAgoMs,
}: {
  kind: QueryKind;
  savedAgoMs: number;
}) => {
  const queryClient = createQueryClient();
  const queryKey = ["test", kind];
  queryClient.setQueryData(queryKey, "保存した結果", {
    updatedAt: Date.now() - savedAgoMs,
  });
  const queryFn = vi.fn(() => Promise.resolve("取り直した結果"));
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(
    () => useKokkaiApi({ kind, queryKey, queryFn }),
    { wrapper },
  );
  return { result, queryFn };
};

describe("[1401] 種類ごとの期限", () => {
  it("[1401] CACHE_POLICY は、会議を30日、ほかを1日にする", () => {
    expect(CACHE_POLICY).toEqual({
      meeting: { staleTimeMs: 30 * DAY_MS },
      speechSearch: { staleTimeMs: DAY_MS },
      speechCount: { staleTimeMs: DAY_MS },
      meetingList: { staleTimeMs: DAY_MS },
    });
  });

  it.each(Object.keys(CACHE_POLICY) as QueryKind[])(
    "[1401] %s は、期限内なら保存した結果を使い、取り直さない",
    async (kind) => {
      const { result, queryFn } = renderWithSavedData({
        kind,
        savedAgoMs: CACHE_POLICY[kind].staleTimeMs - MARGIN_MS,
      });

      expect(result.current.data).toBe("保存した結果");
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(queryFn).not.toHaveBeenCalled();
    },
  );

  it.each(Object.keys(CACHE_POLICY) as QueryKind[])(
    "[1401] %s は、期限が切れたら取り直す",
    async (kind) => {
      const { result, queryFn } = renderWithSavedData({
        kind,
        savedAgoMs: CACHE_POLICY[kind].staleTimeMs + MARGIN_MS,
      });

      await waitFor(() => {
        expect(result.current.data).toBe("取り直した結果");
      });
      expect(queryFn).toHaveBeenCalledTimes(1);
    },
  );
});
