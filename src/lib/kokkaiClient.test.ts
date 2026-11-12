import { http, HttpResponse, type JsonBodyType } from "msw";
import { beforeEach, describe, expect, it } from "vitest";

import {
  fetchMeeting,
  fetchMeetingList,
  fetchSpeeches,
  KokkaiApiError,
} from "@/lib/kokkaiClient";
import { server } from "@/mocks/server";
import {
  errorResponseSchema,
  meetingListResponseSchema,
  meetingResponseSchema,
  speechResponseSchema,
} from "@/types/kokkaiApi";

import meetingSuccess from "../../fixtures/kokkai/meeting/success.json";
import meetingListSuccess from "../../fixtures/kokkai/meeting-list/success.json";
import speechEmpty from "../../fixtures/kokkai/speech/empty.json";
import speechError from "../../fixtures/kokkai/speech/error.json";
import speechSuccess from "../../fixtures/kokkai/speech/success.json";

const API_BASE = "https://kokkai.example.test/api";

// 国会会議録APIの応答の形を写した見本。項目は実際の応答から必要なものに絞った
const MEETING_INFO_SPEECH = {
  speechID: "122204601X00120261022_000",
  issueID: "122204601X00120261022",
  nameOfHouse: "衆議院",
  nameOfMeeting: "総務委員会",
  date: "2026-10-22",
  speechOrder: 0,
  speaker: "会議録情報",
  speakerGroup: null,
  speakerPosition: null,
  speech: "令和八年十月二十二日（木曜日）",
  speechURL: "https://kokkai.ndl.go.jp/txt/122204601X00120261022/0",
};

const MINISTER_SPEECH = {
  speechID: "122204601X00120261022_009",
  issueID: "122204601X00120261022",
  nameOfHouse: "衆議院",
  nameOfMeeting: "総務委員会",
  date: "2026-10-22",
  speechOrder: 9,
  speaker: "藤井比早之",
  speakerYomi: "ふじいひさゆき",
  speakerGroup: "自由民主党・無所属の会",
  speakerPosition: "総務大臣",
  speech:
    "○藤井国務大臣　総務大臣を拝命いたしました。\r\n　よろしくお願いします。",
  speechURL: "https://kokkai.ndl.go.jp/txt/122204601X00120261022/9",
};

const MEMBER_SPEECH = {
  ...MINISTER_SPEECH,
  speechID: "122204601X00120261022_010",
  speechOrder: 10,
  speaker: "無所属の委員",
  speakerGroup: null,
  speakerPosition: null,
  speech: "○委員　質問します。",
  speechURL: "https://kokkai.ndl.go.jp/txt/122204601X00120261022/10",
};

const MEETING_FIELDS = {
  issueID: "122124293X00220260715",
  imageKind: "会議録",
  nameOfHouse: "両院",
  nameOfMeeting: "国家基本政策委員会合同審査会",
  issue: "第2号",
  date: "2026-07-15",
  meetingURL: "https://kokkai.ndl.go.jp/txt/122124293X00220260715",
};

const toMeetingSpeech = ({
  speechID,
  speechOrder,
  speaker,
  speakerGroup,
  speakerPosition,
  speech,
  speechURL,
}: typeof MINISTER_SPEECH | typeof MEETING_INFO_SPEECH) => ({
  speechID,
  speechOrder,
  speaker,
  speakerGroup,
  speakerPosition,
  speech,
  speechURL,
});

let lastRequestUrl: URL | undefined;

// endpoint への応答を差し替え、送られた URL を残す
const respondWith = (endpoint: string, resolver: () => Response): void => {
  server.use(
    http.get(`${API_BASE}/${endpoint}`, ({ request }) => {
      lastRequestUrl = new URL(request.url);
      return resolver();
    }),
  );
};

const respondJson = (
  endpoint: string,
  body: JsonBodyType,
  status = 200,
): void => {
  respondWith(endpoint, () => HttpResponse.json(body, { status }));
};

const requestedUrl = (): URL => {
  if (lastRequestUrl === undefined)
    throw new Error("リクエストが送られていない");
  return lastRequestUrl;
};

beforeEach(() => {
  lastRequestUrl = undefined;
});

describe("fetchSpeeches", () => {
  it("[901] 条件を付けて speech を呼び、Page<Speech> を返す", async () => {
    respondJson("speech", {
      numberOfRecords: 3645,
      nextRecordPosition: 21,
      speechRecord: [MINISTER_SPEECH],
    });

    const page = await fetchSpeeches({
      any: "物価 賃金",
      nameOfHouse: "衆議院",
      from: "2026-07-29",
      startRecord: 1,
      maximumRecords: 20,
    });

    const url = requestedUrl();
    expect(`${url.origin}${url.pathname}`).toBe(`${API_BASE}/speech`);
    expect(Object.fromEntries(url.searchParams)).toEqual({
      any: "物価 賃金",
      nameOfHouse: "衆議院",
      from: "2026-07-29",
      startRecord: "1",
      maximumRecords: "20",
      recordPacking: "json",
    });
    expect(page).toEqual({
      total: 3645,
      nextPosition: 21,
      items: [
        {
          id: "122204601X00120261022_009",
          meetingId: "122204601X00120261022",
          house: "衆議院",
          meetingName: "総務委員会",
          date: "2026-10-22",
          order: 9,
          speaker: "藤井比早之",
          faction: "自由民主党・無所属の会",
          position: "総務大臣",
          text: "○藤井国務大臣　総務大臣を拝命いたしました。\r\n　よろしくお願いします。",
          url: "https://kokkai.ndl.go.jp/txt/122204601X00120261022/9",
        },
      ],
    });
  });

  it("[902] 会議録情報（order が 0）の発言を除き、null の項目を省く", async () => {
    respondJson("speech", {
      numberOfRecords: 2,
      nextRecordPosition: null,
      speechRecord: [MEETING_INFO_SPEECH, MEMBER_SPEECH],
    });

    const page = await fetchSpeeches({ any: "質問" });

    expect(page.items.map((speech) => speech.order)).toEqual([10]);
    expect(page.items[0]).not.toHaveProperty("faction");
    expect(page.items[0]).not.toHaveProperty("position");
    expect(page).not.toHaveProperty("nextPosition");
  });

  it("[903] 0件の応答で、items が空の配列になる", async () => {
    respondJson("speech", {
      numberOfRecords: 0,
      numberOfReturn: 0,
      startRecord: 1,
      nextRecordPosition: null,
    });

    await expect(fetchSpeeches({ any: "該当なし" })).resolves.toEqual({
      total: 0,
      items: [],
    });
  });
});

describe("fetchMeetingList", () => {
  it("[901] 条件を付けて meeting_list を呼び、Page<MeetingSummary> を返す", async () => {
    respondJson("meeting_list", {
      numberOfRecords: 102,
      nextRecordPosition: 2,
      meetingRecord: [
        {
          ...MEETING_FIELDS,
          speechRecord: [
            { speechID: "a", speechOrder: 0, speaker: "会議録情報" },
            { speechID: "b", speechOrder: 1, speaker: "浅田均" },
            { speechID: "c", speechOrder: 2, speaker: "発言者" },
          ],
        },
      ],
    });

    const page = await fetchMeetingList({
      nameOfHouse: "両院",
      maximumRecords: 1,
    });

    const url = requestedUrl();
    expect(url.pathname).toBe("/api/meeting_list");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      nameOfHouse: "両院",
      maximumRecords: "1",
      recordPacking: "json",
    });
    expect(page).toEqual({
      total: 102,
      nextPosition: 2,
      items: [
        {
          id: "122124293X00220260715",
          house: "両院",
          name: "国家基本政策委員会合同審査会",
          issue: "第2号",
          date: "2026-07-15",
          url: "https://kokkai.ndl.go.jp/txt/122124293X00220260715",
          speechCount: 2,
        },
      ],
    });
  });

  it("[903] 0件の応答で、items が空の配列になる", async () => {
    respondJson("meeting_list", {
      numberOfRecords: 0,
      nextRecordPosition: null,
    });

    await expect(fetchMeetingList({ nameOfMeeting: "なし" })).resolves.toEqual({
      total: 0,
      items: [],
    });
  });
});

describe("fetchMeeting", () => {
  it("[901] issueID で meeting を呼び、発言を order の順に並べた Meeting を返す", async () => {
    respondJson("meeting", {
      numberOfRecords: 1,
      nextRecordPosition: null,
      meetingRecord: [
        {
          ...MEETING_FIELDS,
          speechRecord: [
            toMeetingSpeech({ ...MINISTER_SPEECH, speechOrder: 2 }),
            toMeetingSpeech(MEETING_INFO_SPEECH),
            toMeetingSpeech({ ...MINISTER_SPEECH, speechOrder: 1 }),
          ],
        },
      ],
    });

    const meeting = await fetchMeeting("122124293X00220260715");

    const url = requestedUrl();
    expect(url.pathname).toBe("/api/meeting");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      issueID: "122124293X00220260715",
      recordPacking: "json",
    });
    expect(meeting).toMatchObject({
      id: "122124293X00220260715",
      house: "両院",
      name: "国家基本政策委員会合同審査会",
      issue: "第2号",
      date: "2026-07-15",
      url: "https://kokkai.ndl.go.jp/txt/122124293X00220260715",
    });
    expect(meeting.speeches.map((speech) => speech.order)).toEqual([1, 2]);
    expect(meeting.speeches[0]).toMatchObject({
      meetingId: "122124293X00220260715",
      house: "両院",
      meetingName: "国家基本政策委員会合同審査会",
      date: "2026-07-15",
      speaker: "藤井比早之",
      faction: "自由民主党・無所属の会",
    });
  });

  it("[904] 会議が見つからないとき、kind が response のエラーになる", async () => {
    respondJson("meeting", { numberOfRecords: 0, nextRecordPosition: null });

    await expect(fetchMeeting("unknown")).rejects.toMatchObject({
      kind: "response",
    });
  });
});

describe("KokkaiApiError", () => {
  it("[904] 通信に失敗したとき、kind が network になる", async () => {
    respondWith("speech", () => HttpResponse.error());

    const error = await fetchSpeeches({ any: "物価" }).catch(
      (error: unknown) => error,
    );

    expect(error).toBeInstanceOf(KokkaiApiError);
    expect(error).toMatchObject({ kind: "network" });
  });

  it("[904] 条件の誤りの応答で、kind が badRequest になる", async () => {
    respondJson(
      "speech",
      {
        message: "(19011)検索条件の入力に誤りがあります。",
        details: [
          "(0) (19005)maximumRecordsには1～100の値を指定してください。",
        ],
      },
      400,
    );

    await expect(
      fetchSpeeches({ any: "物価", maximumRecords: 0 }),
    ).rejects.toMatchObject({
      kind: "badRequest",
      message: "(19011)検索条件の入力に誤りがあります。",
    });
  });

  it("[904] 500番台の応答で、kind が server になる", async () => {
    respondWith(
      "meeting_list",
      () => new HttpResponse("Service Unavailable", { status: 503 }),
    );

    await expect(fetchMeetingList({ any: "物価" })).rejects.toMatchObject({
      kind: "server",
    });
  });

  it("[904] スキーマを通らない応答で、kind が response になる", async () => {
    respondJson("speech", {
      numberOfRecords: 1,
      nextRecordPosition: null,
      speechRecord: [{ ...MINISTER_SPEECH, speechOrder: "9" }],
    });

    await expect(fetchSpeeches({ any: "物価" })).rejects.toMatchObject({
      kind: "response",
    });
  });

  it("[904] JSON でない応答で、kind が response になる", async () => {
    respondWith("speech", () => new HttpResponse("<xml/>", { status: 200 }));

    await expect(fetchSpeeches({ any: "物価" })).rejects.toMatchObject({
      kind: "response",
    });
  });
});

describe("見本のデータ", () => {
  it("[1001] speech の成功と0件の見本が、応答のスキーマを通る", () => {
    expect(speechResponseSchema.parse(speechSuccess).speechRecord).toHaveLength(
      3,
    );
    expect(
      speechResponseSchema.parse(speechEmpty).speechRecord,
    ).toBeUndefined();
  });

  it("[1001] meeting_list と meeting の成功の見本が、応答のスキーマを通る", () => {
    expect(
      meetingListResponseSchema.parse(meetingListSuccess).meetingRecord,
    ).toHaveLength(3);
    expect(
      meetingResponseSchema.parse(meetingSuccess).meetingRecord,
    ).toHaveLength(1);
  });

  it("[1001] speech の 400 の見本が、エラーのスキーマを通る", () => {
    expect(errorResponseSchema.parse(speechError).message).toMatch(
      /^\(19011\)/,
    );
  });
});

describe("MSW の既定の応答", () => {
  it("[1004] fetchSpeeches が、speech の見本のデータを Page<Speech> に変える", async () => {
    const page = await fetchSpeeches({ any: "物価", maximumRecords: 3 });

    expect(page.total).toBe(144750);
    expect(page.nextPosition).toBe(4);
    expect(page.items.map((speech) => speech.speaker)).toEqual([
      "藤井比早之",
      "葉梨康弘",
      "藤井比早之",
    ]);
  });

  it("[1004] fetchMeetingList が、meeting_list の見本のデータを Page<MeetingSummary> に変える", async () => {
    const page = await fetchMeetingList({ from: "2026-10-28" });

    expect(page.items.map((meeting) => meeting.id)).toEqual([
      "122215382X00220261028",
      "122204024X00720261106",
      "122204024X00620261030",
    ]);
    expect(page.items[1]).toMatchObject({
      name: "議院運営委員会",
      speechCount: 10,
    });
  });

  it("[1004] fetchMeeting が、meeting の見本のデータを会議録情報を除いた Meeting に変える", async () => {
    const meeting = await fetchMeeting("122204024X00720261106");

    expect(meeting).toMatchObject({ name: "議院運営委員会", issue: "第7号" });
    expect(meeting.speeches.map((speech) => speech.order)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
    ]);
  });
});
