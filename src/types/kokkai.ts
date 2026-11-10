export const HOUSES = ["衆議院", "参議院", "両院"] as const;

export type House = (typeof HOUSES)[number];

export type Speech = {
  id: string;
  meetingId: string;
  house: House;
  meetingName: string;
  date: string;
  order: number;
  speaker: string;
  faction?: string;
  position?: string;
  text: string;
  url: string;
};

export type Meeting = {
  id: string;
  house: House;
  name: string;
  issue: string;
  date: string;
  url: string;
  speeches: Speech[];
};

export type MeetingSummary = Omit<Meeting, "speeches"> & {
  speechCount: number;
};

export type Page<T> = {
  total: number;
  items: T[];
  nextPosition?: number;
};
