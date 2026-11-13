import { http, HttpResponse } from "msw";
import { z } from "zod";

import meetingSuccess from "../../fixtures/kokkai/meeting/success.json";
import meetingListSuccess from "../../fixtures/kokkai/meeting-list/success.json";
import speechSuccess from "../../fixtures/kokkai/speech/success.json";

export const KOKKAI_API_BASE = z
  .url()
  .parse(import.meta.env.VITE_KOKKAI_API_BASE);

export const KOKKAI_ENDPOINTS = {
  speech: `${KOKKAI_API_BASE}/speech`,
  meetingList: `${KOKKAI_API_BASE}/meeting_list`,
  meeting: `${KOKKAI_API_BASE}/meeting`,
} as const;

export const handlers = [
  http.get(KOKKAI_ENDPOINTS.speech, () => HttpResponse.json(speechSuccess)),
  http.get(KOKKAI_ENDPOINTS.meetingList, () =>
    HttpResponse.json(meetingListSuccess),
  ),
  http.get(KOKKAI_ENDPOINTS.meeting, () => HttpResponse.json(meetingSuccess)),
];
