import { z } from "zod";

import { HOUSES } from "@/types/kokkai";

// 国会会議録APIの応答のうち、使う項目だけを書く。ほかの項目は無視する
const houseSchema = z.enum(HOUSES);

const speechRecordSchema = z.object({
  speechID: z.string(),
  issueID: z.string(),
  nameOfHouse: houseSchema,
  nameOfMeeting: z.string(),
  date: z.string(),
  speechOrder: z.number(),
  speaker: z.string(),
  speakerGroup: z.string().nullable(),
  speakerPosition: z.string().nullable(),
  speech: z.string(),
  speechURL: z.string(),
});

const meetingFields = {
  issueID: z.string(),
  nameOfHouse: houseSchema,
  nameOfMeeting: z.string(),
  issue: z.string(),
  date: z.string(),
  meetingURL: z.string(),
};

// meeting_list の発言は、番号と発言者だけを返す
const meetingListRecordSchema = z.object({
  ...meetingFields,
  speechRecord: z.array(z.object({ speechOrder: z.number() })),
});

// meeting の発言には、会議の項目（issueID、nameOfHouse など）が付かない
const meetingSpeechRecordSchema = speechRecordSchema.omit({
  issueID: true,
  nameOfHouse: true,
  nameOfMeeting: true,
  date: true,
});

const meetingRecordSchema = z.object({
  ...meetingFields,
  speechRecord: z.array(meetingSpeechRecordSchema),
});

const pageFields = {
  numberOfRecords: z.number(),
  // 最後のページでは null
  nextRecordPosition: z.number().nullable(),
};

// 0件では speechRecord、meetingRecord の項目ごとない
export const speechResponseSchema = z.object({
  ...pageFields,
  speechRecord: z.array(speechRecordSchema).optional(),
});

export const meetingListResponseSchema = z.object({
  ...pageFields,
  meetingRecord: z.array(meetingListRecordSchema).optional(),
});

export const meetingResponseSchema = z.object({
  ...pageFields,
  meetingRecord: z.array(meetingRecordSchema).optional(),
});

export const errorResponseSchema = z.object({
  message: z.string(),
});

export type SpeechRecord = z.infer<typeof speechRecordSchema>;
export type MeetingListRecord = z.infer<typeof meetingListRecordSchema>;
export type MeetingRecord = z.infer<typeof meetingRecordSchema>;
