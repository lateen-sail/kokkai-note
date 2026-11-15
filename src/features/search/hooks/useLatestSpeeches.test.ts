import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { expect, it } from "vitest";

import { useLatestSpeeches } from "@/features/search/hooks/useLatestSpeeches";
import { server } from "@/mocks/server";
import { createWrapper } from "@/test/render";

import speechSuccess from "../../../../fixtures/kokkai/speech/success.json";

const SPEECH_ENDPOINT = "https://kokkai.example.test/api/speech";

it("[1101] 新しい発言を1件、物価の条件で取得する", async () => {
  const requests: URL[] = [];
  server.use(
    http.get(SPEECH_ENDPOINT, ({ request }) => {
      requests.push(new URL(request.url));
      return HttpResponse.json(speechSuccess);
    }),
  );

  const { result } = renderHook(() => useLatestSpeeches(), {
    wrapper: createWrapper(),
  });

  await waitFor(() => {
    expect(result.current.isPending).toBe(false);
  });
  expect(result.current.isError).toBe(false);
  expect(result.current.speech).toMatchObject({
    speaker: "藤井比早之",
    text: speechSuccess.speechRecord[0]?.speech,
  });
  expect(requests).toHaveLength(1);
  expect(Object.fromEntries(requests[0]?.searchParams ?? [])).toEqual({
    any: "物価",
    maximumRecords: "1",
    recordPacking: "json",
  });
});

it("[1101] 取得に失敗すると isError になる", async () => {
  server.use(http.get(SPEECH_ENDPOINT, () => HttpResponse.error()));

  const { result } = renderHook(() => useLatestSpeeches(), {
    wrapper: createWrapper(),
  });

  await waitFor(() => {
    expect(result.current.isError).toBe(true);
  });
  expect(result.current.speech).toBeUndefined();
});
