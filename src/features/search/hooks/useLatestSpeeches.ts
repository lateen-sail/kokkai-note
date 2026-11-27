import { useKokkaiApi } from "@/hooks/useKokkaiApi";
import { fetchSpeeches, type KokkaiQuery } from "@/lib/kokkaiClient";
import type { Speech } from "@/types/kokkai";

type UseLatestSpeeches = () => {
  speech?: Speech;
  isPending: boolean;
  isError: boolean;
};

// #33 でテーマと4件の組に広げる。それまでは物価のテーマの語で1件だけ取る
const LATEST_SPEECH_QUERY = {
  any: "物価",
  maximumRecords: 1,
} as const satisfies KokkaiQuery;

export const useLatestSpeeches: UseLatestSpeeches = () => {
  const { data, isPending, isError } = useKokkaiApi({
    kind: "speechSearch",
    queryKey: ["speeches", LATEST_SPEECH_QUERY],
    queryFn: () => fetchSpeeches(LATEST_SPEECH_QUERY),
  });
  const speech = data?.items[0];
  return { ...(speech === undefined ? {} : { speech }), isPending, isError };
};
