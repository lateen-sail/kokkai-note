import { describe, expect, it } from "vitest";

import { KOKKAI_API_BASE } from "@/mocks/handlers";

import meetingSuccess from "../../fixtures/kokkai/meeting/success.json";
import meetingListSuccess from "../../fixtures/kokkai/meeting-list/success.json";
import speechSuccess from "../../fixtures/kokkai/speech/success.json";

const getJson = async (path: string): Promise<unknown> => {
  const response = await fetch(`${KOKKAI_API_BASE}/${path}`);
  return response.json();
};

describe("handlers", () => {
  it("[1002] 3つのエンドポイントで、成功の見本のデータを返す", async () => {
    await expect(getJson("speech?any=物価")).resolves.toEqual(speechSuccess);
    await expect(getJson("meeting_list?from=2026-10-28")).resolves.toEqual(
      meetingListSuccess,
    );
    await expect(getJson("meeting?issueID=x")).resolves.toEqual(meetingSuccess);
  });
});
