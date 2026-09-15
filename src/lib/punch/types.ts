export type DayStatus = "normal" | "leave" | "holiday";

export type DayRecord = {
  /** 北京时间日期，"2026-09-15" */
  date: string;
  /** 上班打卡时刻 "09:32" */
  in?: string;
  /** 下班打卡时刻 "18:41" */
  out?: string;
  note?: string;
  status: DayStatus;
  /** true 表示这条记录被手动补卡或编辑过 */
  manual?: boolean;
  updatedAt: string;
};

export type Settings = {
  /** 上班打卡截止时刻，晚于此算迟到 */
  clockInDeadline: string;
  /** 一天工时（含午休）的分钟数 */
  workMinutes: number;
  /** 早提醒时刻 */
  morningReminder: string;
};

export const DEFAULT_SETTINGS: Settings = {
  clockInDeadline: "10:00",
  workMinutes: 540,
  morningReminder: "09:55",
};

export type PushSub = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export const STATUS_LABEL: Record<DayStatus, string> = {
  normal: "正常",
  leave: "请假",
  holiday: "假期",
};
