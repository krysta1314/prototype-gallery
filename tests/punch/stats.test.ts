import { describe, it, expect } from "vitest";
import { monthDateKeys, isMissingPunch, summarizeMonth } from "@/lib/punch/stats";
import { DEFAULT_SETTINGS, type DayRecord } from "@/lib/punch/types";

const rec = (date: string, p: Partial<DayRecord> = {}): DayRecord => ({
  date,
  status: "normal",
  updatedAt: "2026-09-15T00:00:00.000Z",
  ...p,
});

describe("monthDateKeys", () => {
  it("2026 年 9 月有 30 天", () => {
    const keys = monthDateKeys(2026, 9);
    expect(keys).toHaveLength(30);
    expect(keys[0]).toBe("2026-09-01");
    expect(keys[29]).toBe("2026-09-30");
  });

  it("2026 年 2 月有 28 天，2024 年 2 月有 29 天", () => {
    expect(monthDateKeys(2026, 2)).toHaveLength(28);
    expect(monthDateKeys(2024, 2)).toHaveLength(29);
  });
});

describe("缺卡判定", () => {
  const today = "2026-09-15";

  it("未来的日子不算缺卡", () => {
    expect(isMissingPunch(undefined, "2026-09-20", today)).toBe(false);
  });

  it("过去的工作日没有任何记录算缺卡", () => {
    expect(isMissingPunch(undefined, "2026-09-14", today)).toBe(true);
  });

  it("过去的周末没有记录不算缺卡", () => {
    expect(isMissingPunch(undefined, "2026-09-13", today)).toBe(false);
  });

  it("有上班卡没下班卡算缺卡", () => {
    expect(isMissingPunch(rec("2026-09-14", { in: "09:30" }), "2026-09-14", today)).toBe(true);
  });

  it("上下班都打了不算缺卡", () => {
    expect(
      isMissingPunch(rec("2026-09-14", { in: "09:30", out: "18:30" }), "2026-09-14", today)
    ).toBe(false);
  });

  it("标了请假的日子不算缺卡", () => {
    expect(isMissingPunch(rec("2026-09-14", { status: "leave" }), "2026-09-14", today)).toBe(false);
  });

  it("标了假期的日子不算缺卡", () => {
    expect(isMissingPunch(rec("2026-09-14", { status: "holiday" }), "2026-09-14", today)).toBe(false);
  });

  it("今天本身也参与判定 —— 今天还没打下班卡算缺卡", () => {
    expect(isMissingPunch(rec(today, { in: "09:30" }), today, today)).toBe(true);
  });
});

describe("月度汇总", () => {
  const today = "2026-09-30";

  it("出勤天数包含周末补班", () => {
    const records = [
      rec("2026-09-14", { in: "09:30", out: "18:30" }), // 周一
      rec("2026-09-15", { in: "09:40", out: "18:40" }), // 周二
      rec("2026-09-19", { in: "10:00", out: "19:00" }), // 周六补班
    ];
    const s = summarizeMonth(2026, 9, records, DEFAULT_SETTINGS, today);
    expect(s.attendedDays).toBe(3);
  });

  it("迟到只算工作日，周末补班不算迟到", () => {
    const records = [
      rec("2026-09-14", { in: "10:30", out: "19:30" }), // 周一迟到
      rec("2026-09-19", { in: "11:00", out: "20:00" }), // 周六，不算迟到
      rec("2026-09-15", { in: "10:00", out: "19:00" }), // 正好 10:00 不算迟到
    ];
    const s = summarizeMonth(2026, 9, records, DEFAULT_SETTINGS, today);
    expect(s.lateDays).toBe(1);
  });

  it("平均工时只统计上下班都齐的日子", () => {
    const records = [
      rec("2026-09-14", { in: "09:00", out: "18:00" }), // 540
      rec("2026-09-15", { in: "09:00", out: "19:00" }), // 600
      rec("2026-09-16", { in: "09:00" }), // 缺下班卡，不计入
    ];
    const s = summarizeMonth(2026, 9, records, DEFAULT_SETTINGS, today);
    expect(s.avgWorkedMinutes).toBe(570);
  });

  it("一条记录都没有时不除以零，但整月工作日都算缺卡", () => {
    const s = summarizeMonth(2026, 9, [], DEFAULT_SETTINGS, today);
    expect(s.attendedDays).toBe(0);
    expect(s.avgWorkedMinutes).toBe(0);
    // 2026 年 9 月 1-30 日共 22 个工作日
    expect(s.missingDays).toBe(22);
  });

  it("请假和假期不计入出勤", () => {
    const records = [
      rec("2026-09-14", { status: "leave" }),
      rec("2026-09-15", { status: "holiday" }),
    ];
    expect(summarizeMonth(2026, 9, records, DEFAULT_SETTINGS, today).attendedDays).toBe(0);
  });
});
