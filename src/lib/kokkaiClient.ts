import { z } from "zod";

import type {
  House,
  Meeting,
  MeetingSummary,
  Page,
  Speech,
} from "@/types/kokkai";
import {
  errorResponseSchema,
  type MeetingListRecord,
  meetingListResponseSchema,
  type MeetingRecord,
  meetingResponseSchema,
  type SpeechRecord,
  speechResponseSchema,
} from "@/types/kokkaiApi";

export type KokkaiQuery = {
  any?: string;
  speaker?: string;
  nameOfHouse?: House;
  nameOfMeeting?: string;
  from?: string;
  until?: string;
  startRecord?: number;
  maximumRecords?: number;
};

export type KokkaiApiErrorKind =
  "network" | "badRequest" | "server" | "response";

export class KokkaiApiError extends Error {
  readonly kind: KokkaiApiErrorKind;

  constructor({
    kind,
    message,
    cause,
  }: {
    kind: KokkaiApiErrorKind;
    message: string;
    cause?: unknown;
  }) {
    super(message, { cause });
    this.name = "KokkaiApiError";
    this.kind = kind;
  }
}

// 会議録情報（出席者や議事日程）の発言の番号。発言として扱わない
const MEETING_INFO_ORDER = 0;
const SERVER_ERROR_STATUS = 500;

type QueryParams = Record<string, string | number | undefined>;

const apiBaseUrl = (): string =>
  z.url().parse(import.meta.env.VITE_KOKKAI_API_BASE);

const buildUrl = (endpoint: string, params: QueryParams): URL => {
  const url = new URL(`${apiBaseUrl()}/${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  // 付けないと XML が返る
  url.searchParams.set("recordPacking", "json");
  return url;
};

const toHttpError = async (response: Response): Promise<KokkaiApiError> => {
  const body: unknown = await response.json().catch(() => undefined);
  const parsed = errorResponseSchema.safeParse(body);
  return new KokkaiApiError({
    kind: response.status >= SERVER_ERROR_STATUS ? "server" : "badRequest",
    message: parsed.success
      ? parsed.data.message
      : `国会会議録APIが ${response.status} を返しました`,
  });
};

const request = async <T>({
  endpoint,
  params,
  schema,
}: {
  endpoint: string;
  params: QueryParams;
  schema: z.ZodType<T>;
}): Promise<T> => {
  const url = buildUrl(endpoint, params);
  const response = await fetch(url).catch((cause: unknown) => {
    throw new KokkaiApiError({
      kind: "network",
      message: "国会会議録APIに接続できませんでした",
      cause,
    });
  });
  if (!response.ok) throw await toHttpError(response);

  const body: unknown = await response.json().catch((cause: unknown) => {
    throw new KokkaiApiError({
      kind: "response",
      message: "国会会議録APIの応答が JSON ではありません",
      cause,
    });
  });
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new KokkaiApiError({
      kind: "response",
      message: "国会会議録APIの応答の形が想定と違います",
      cause: result.error,
    });
  }
  return result.data;
};

const isSpeech = ({ speechOrder }: { speechOrder: number }): boolean =>
  speechOrder !== MEETING_INFO_ORDER;

const toSpeech = (record: SpeechRecord): Speech => ({
  id: record.speechID,
  meetingId: record.issueID,
  house: record.nameOfHouse,
  meetingName: record.nameOfMeeting,
  date: record.date,
  order: record.speechOrder,
  speaker: record.speaker,
  ...(record.speakerGroup === null ? {} : { faction: record.speakerGroup }),
  ...(record.speakerPosition === null
    ? {}
    : { position: record.speakerPosition }),
  text: record.speech,
  url: record.speechURL,
});

const toMeetingFields = (
  record: MeetingListRecord | MeetingRecord,
): Omit<Meeting, "speeches"> => ({
  id: record.issueID,
  house: record.nameOfHouse,
  name: record.nameOfMeeting,
  issue: record.issue,
  date: record.date,
  url: record.meetingURL,
});

const toMeetingSummary = (record: MeetingListRecord): MeetingSummary => ({
  ...toMeetingFields(record),
  speechCount: record.speechRecord.filter(isSpeech).length,
});

// meeting の発言には会議の項目が付かないため、会議の項目から写す
const toMeeting = (record: MeetingRecord): Meeting => ({
  ...toMeetingFields(record),
  speeches: record.speechRecord
    .filter(isSpeech)
    .map((speech) =>
      toSpeech({
        ...speech,
        issueID: record.issueID,
        nameOfHouse: record.nameOfHouse,
        nameOfMeeting: record.nameOfMeeting,
        date: record.date,
      }),
    )
    .toSorted((a, b) => a.order - b.order),
});

const toPage = <T>(
  {
    numberOfRecords,
    nextRecordPosition,
  }: { numberOfRecords: number; nextRecordPosition: number | null },
  items: T[],
): Page<T> => ({
  total: numberOfRecords,
  items,
  ...(nextRecordPosition === null ? {} : { nextPosition: nextRecordPosition }),
});

export const fetchSpeeches = async (
  query: KokkaiQuery,
): Promise<Page<Speech>> => {
  const response = await request({
    endpoint: "speech",
    params: query,
    schema: speechResponseSchema,
  });
  const records = response.speechRecord ?? [];
  return toPage(response, records.filter(isSpeech).map(toSpeech));
};

export const fetchMeetingList = async (
  query: KokkaiQuery,
): Promise<Page<MeetingSummary>> => {
  const response = await request({
    endpoint: "meeting_list",
    params: query,
    schema: meetingListResponseSchema,
  });
  const records = response.meetingRecord ?? [];
  return toPage(response, records.map(toMeetingSummary));
};

export const fetchMeeting = async (meetingId: string): Promise<Meeting> => {
  const response = await request({
    endpoint: "meeting",
    params: { issueID: meetingId },
    schema: meetingResponseSchema,
  });
  const record = response.meetingRecord?.[0];
  if (record === undefined) {
    throw new KokkaiApiError({
      kind: "response",
      message: `会議 ${meetingId} が見つかりませんでした`,
    });
  }
  return toMeeting(record);
};
