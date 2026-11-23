import "fake-indexeddb/auto";

import { type QueryClient, useQuery } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { render, screen, waitFor } from "@testing-library/react";
import { clear, get } from "idb-keyval";
import { http, HttpResponse } from "msw";
import { beforeEach, expect, it } from "vitest";

import { fetchSpeeches } from "@/lib/kokkaiClient";
import { createQueryClient } from "@/lib/queryClient";
import { createPersistOptions, PERSIST_KEY } from "@/lib/queryPersister";
import { server } from "@/mocks/server";

import speechSuccess from "../../fixtures/kokkai/speech/success.json";

const SPEECH_ENDPOINT = "https://kokkai.example.test/api/speech";
// 保存は1秒ごとにまとめて書くため、待つ時間をその分だけ延ばす
const PERSIST_WAIT_MS = 3000;

type StoredQuery = {
  queryKey: unknown[];
  state: { status: string };
};

const readStoredQueries = async (): Promise<StoredQuery[] | undefined> => {
  const stored = await get<string>(PERSIST_KEY);
  if (stored === undefined) return undefined;
  const parsed = JSON.parse(stored) as {
    clientState: { queries: StoredQuery[] };
  };
  return parsed.clientState.queries;
};

function FirstSpeaker() {
  const { data } = useQuery({
    queryKey: ["speeches", { any: "物価" }],
    queryFn: () => fetchSpeeches({ any: "物価", maximumRecords: 1 }),
  });
  return <p>{data?.items[0]?.speaker ?? "読み込み中"}</p>;
}

const renderWithPersist = (queryClient: QueryClient) =>
  render(
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={createPersistOptions()}
    >
      <FirstSpeaker />
    </PersistQueryClientProvider>,
  );

beforeEach(async () => {
  await clear();
});

it("[1301] 取得した結果を IndexedDB に保存し、開き直すと保存した結果から表示する", async () => {
  let requestCount = 0;
  server.use(
    http.get(SPEECH_ENDPOINT, () => {
      requestCount++;
      return HttpResponse.json(speechSuccess);
    }),
  );

  const firstVisit = renderWithPersist(createQueryClient());
  expect(await screen.findByText("藤井比早之")).toBeInTheDocument();
  await waitFor(
    async () => {
      expect(await readStoredQueries()).toHaveLength(1);
    },
    { timeout: PERSIST_WAIT_MS },
  );
  firstVisit.unmount();

  renderWithPersist(createQueryClient());
  expect(await screen.findByText("藤井比早之")).toBeInTheDocument();
  expect(requestCount).toBe(1);
});

it("[1302] 失敗した取得の結果は保存せず、成功した結果だけを保存する", async () => {
  const queryClient = createQueryClient();
  server.use(http.get(SPEECH_ENDPOINT, () => HttpResponse.error()));
  renderWithPersist(queryClient);
  await waitFor(() => {
    expect(
      queryClient.getQueryState(["speeches", { any: "物価" }])?.status,
    ).toBe("error");
  });

  queryClient.setQueryData(["succeeded"], { total: 0 });

  await waitFor(
    async () => {
      const stored = await readStoredQueries();
      expect(
        stored?.map(({ queryKey, state: { status } }) => ({
          queryKey,
          status,
        })),
      ).toEqual([{ queryKey: ["succeeded"], status: "success" }]);
    },
    { timeout: PERSIST_WAIT_MS },
  );
});
