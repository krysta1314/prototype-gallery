import { describe, it, expect } from "vitest";
import {
  beijingParts,
  beijingDateKey,
  beijingHHMM,
  parseHHMM,
  formatHHMM,
  isWeekendKey,
  computeLeaveMinutes,
  isLate,
  workedMinutes,
  beijingEpochMs,
  beijingWeekdayHHMMToUtcCron,
} from "@/lib/punch/time";

describe("北京时间换算", () => {
  it("UTC 01:32 是北京 09:32 同一天", () => {
    const d = new Date("2026-09-15T01:32:00Z");
    expect(beijingDateKey(d)).toBe("2026-09-15");
    expect(beijingHHMM(d)).toBe("09:32");
  });

  it("UTC 前一天 17:00 已经是北京第二天 01:00", () => {
    const d = new Date("2026-09-14T17:00:00Z");
    expect(beijingDateKey(d)).toBe("2026-09-15");
    expect(beijingHHMM(d)).toBe("01:00");
  });

  it("UTC 同一天 23:30 是北京第二天 07:30", () => {
    const d = new Date("2026-09-15T23:30:00Z");
    expect(beijingDateKey(d)).toBe("2026-09-16");
    expect(beijingHHMM(d)).toBe("07:30");
  });

  it("跨月边界", () => {
    expect(beijingDateKey(new Date("2026-08-31T16:00:00Z"))).toBe("2026-09-01");
  });

  it("跨年边界", () => {
    expect(beijingDateKey(new Date("2026-12-31T16:00:00Z"))).toBe("2027-01-01");
  });

  it("weekday 按北京时间算，0 是周日", () => {
    // 2026-09-13 是周日
    expect(beijingParts(new Date("2026-09-13T02:00:00Z")).weekday).toBe(0);
    // UTC 是 09-12 周六 17:00，北京已是 09-13 周日
    expect(beijingParts(new Date("2026-09-12T17:00:00Z")).weekday).toBe(0);
  });
});

describe("HH:MM 解析与格式化", () => {
  it("parseHHMM 转成分钟数", () => {
    expect(parseHHMM("00:00")).toBe(0);
    expect(parseHHMM("09:32")).toBe(572);
    expect(parseHHMM("23:59")).toBe(1439);
  });

  it("formatHHMM 补零", () => {
    expect(formatHHMM(0)).toBe("00:00");
    expect(formatHHMM(572)).toBe("09:32");
    expect(formatHHMM(1439)).toBe("23:59");
  });

  it("formatHHMM 对超过一天的分钟数取模", () => {
    expect(formatHHMM(1440)).toBe("00:00");
    expect(formatHHMM(1500)).toBe("01:00");
  });

  it("parseHHMM 遇到非法输入抛错", () => {
    expect(() => parseHHMM("9:32")).toThrow();
    expect(() => parseHHMM("25:00")).toThrow();
    expect(() => parseHHMM("09:60")).toThrow();
    expect(() => parseHHMM("")).toThrow();
  });
});

describe("周末判定", () => {
  it("2026-09-12 是周六，09-13 是周日", () => {
    expect(isWeekendKey("2026-09-12")).toBe(true);
    expect(isWeekendKey("2026-09-13")).toBe(true);
  });

  it("2026-09-14 周一到 09-18 周五都不是周末", () => {
    for (const k of ["2026-09-14", "2026-09-15", "2026-09-16", "2026-09-17", "2026-09-18"]) {
      expect(isWeekendKey(k)).toBe(false);
    }
  });
});

describe("下班时间 = 上班 + 9 小时", () => {
  it("09:30 打卡 18:30 下班", () => {
    expect(formatHHMM(computeLeaveMinutes("09:30", 540))).toBe("18:30");
  });

  it("09:40 打卡 18:40 下班", () => {
    expect(formatHHMM(computeLeaveMinutes("09:40", 540))).toBe("18:40");
  });

  it("不设下限：09:00 打卡就是 18:00 下班", () => {
    expect(formatHHMM(computeLeaveMinutes("09:00", 540))).toBe("18:00");
  });

  it("返回的是原始分钟数，可能超过 1440", () => {
    expect(computeLeaveMinutes("20:00", 540)).toBe(1740);
  });
});

describe("迟到判定", () => {
  it("09:59 不迟到，10:00 不迟到，10:01 迟到", () => {
    expect(isLate("09:59", "10:00")).toBe(false);
    expect(isLate("10:00", "10:00")).toBe(false);
    expect(isLate("10:01", "10:00")).toBe(true);
  });
});

describe("工时计算", () => {
  it("09:30 到 18:30 是 540 分钟", () => {
    expect(workedMinutes("09:30", "18:30")).toBe(540);
  });

  it("下班早于上班视为跨天", () => {
    expect(workedMinutes("22:00", "02:00")).toBe(240);
  });
});

describe("北京时刻转 epoch", () => {
  it("2026-09-15 09:30 北京 == 2026-09-15T01:30:00Z", () => {
    expect(beijingEpochMs("2026-09-15", "09:30")).toBe(Date.parse("2026-09-15T01:30:00Z"));
  });

  it("北京 01:00 对应前一天的 UTC 17:00", () => {
    expect(beijingEpochMs("2026-09-15", "01:00")).toBe(Date.parse("2026-09-14T17:00:00Z"));
  });
});

describe("北京时间转 UTC cron（早提醒）", () => {
  it("09:55 -> UTC 01:55，周一至周五", () => {
    expect(beijingWeekdayHHMMToUtcCron("09:55")).toBe("55 1 * * 1-5");
  });

  it("08:00 -> UTC 00:00，周一至周五（边界，不跨天）", () => {
    expect(beijingWeekdayHHMMToUtcCron("08:00")).toBe("0 0 * * 1-5");
  });

  it("07:00 -> 跨日，UTC 前一天 23:00，星期前移到周日至周四", () => {
    expect(beijingWeekdayHHMMToUtcCron("07:00")).toBe("0 23 * * 0-4");
  });

  it("00:30 -> 跨日，UTC 前一天 16:30，星期前移到周日至周四", () => {
    expect(beijingWeekdayHHMMToUtcCron("00:30")).toBe("30 16 * * 0-4");
  });
});
