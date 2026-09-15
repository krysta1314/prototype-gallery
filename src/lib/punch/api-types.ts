import type { DayRecord, Settings } from "./types";

export type TodayResponse = {
  today: string;
  now: string;
  record: DayRecord | null;
  settings: Settings;
  leaveAt: string | null;
  leaveAtMs: number | null;
  late: boolean;
};

export type ClockOk = { ok: true; record: DayRecord; scheduled?: boolean };
export type ApiError = { error: string };
