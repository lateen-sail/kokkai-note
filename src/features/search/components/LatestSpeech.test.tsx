import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { expect, it } from "vitest";

import { LatestSpeech } from "@/features/search/components/LatestSpeech";
import { server } from "@/mocks/server";
import { renderWithProviders } from "@/test/render";

import speechEmpty from "../../../../fixtures/kokkai/speech/empty.json";

const SPEECH_ENDPOINT = "https://kokkai.example.test/api/speech";

it("[1101] 新しい発言を、発言者と本文で表示する", async () => {
  renderWithProviders(<LatestSpeech />);

  expect(screen.getByText("新しい発言を読み込んでいます")).toBeInTheDocument();
  expect(await screen.findByText("藤井比早之")).toBeInTheDocument();
  expect(screen.getByText(/地方創生を担当する/)).toBeInTheDocument();
});

it("[1101] 取得に失敗すると、読み込めなかったことを表示する", async () => {
  server.use(http.get(SPEECH_ENDPOINT, () => HttpResponse.error()));

  renderWithProviders(<LatestSpeech />);

  expect(
    await screen.findByText("新しい発言を読み込めませんでした"),
  ).toBeInTheDocument();
});

it("[1101] 発言がないと、ないことを表示する", async () => {
  server.use(http.get(SPEECH_ENDPOINT, () => HttpResponse.json(speechEmpty)));

  renderWithProviders(<LatestSpeech />);

  expect(await screen.findByText("新しい発言はありません")).toBeInTheDocument();
});
