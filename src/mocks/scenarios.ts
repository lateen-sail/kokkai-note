import { delay, http, type HttpHandler, HttpResponse } from "msw";

import { KOKKAI_ENDPOINTS } from "@/mocks/handlers";

import speechEmpty from "../../fixtures/kokkai/speech/empty.json";
import speechError from "../../fixtures/kokkai/speech/error.json";

type MockScenario = "empty" | "error" | "network" | "slow";

type Scenarios = Record<MockScenario, HttpHandler[]>;

export const SLOW_RESPONSE_MS = 3000;

const BAD_REQUEST_STATUS = 400;

const ALL_ENDPOINTS = Object.values(KOKKAI_ENDPOINTS);

// 0件とエラーは、見本のデータがある speech だけを切り替える
export const scenarios: Scenarios = {
  empty: [
    http.get(KOKKAI_ENDPOINTS.speech, () => HttpResponse.json(speechEmpty)),
  ],
  error: [
    http.get(KOKKAI_ENDPOINTS.speech, () =>
      HttpResponse.json(speechError, { status: BAD_REQUEST_STATUS }),
    ),
  ],
  network: ALL_ENDPOINTS.map((url) =>
    http.get(url, () => HttpResponse.error()),
  ),
  // 何も返さないと、待った後に handlers の成功の応答へ進む
  slow: ALL_ENDPOINTS.map((url) =>
    http.get(url, async () => {
      await delay(SLOW_RESPONSE_MS);
    }),
  ),
};

const isMockScenario = (name: string): name is MockScenario =>
  Object.hasOwn(scenarios, name);

export const findScenario = (name: string | null): HttpHandler[] =>
  name !== null && isMockScenario(name) ? scenarios[name] : [];
