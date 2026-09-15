import { describe, it, expect } from "vitest";
import { toCsv } from "@/app/punch/_components/csv";
import type { DayCell } from "@/lib/punch/api-types";

const cell = (p: Partial<DayCell> & { date: string }): DayCell => ({
  weekend: false,
  missing: false,
  record: null,
  workedMinutes: null,
  late: false,
  ...p,
});

describe("CSV 导出", () => {
  it("第一行是中文表头", () => {
    expect(toCsv([]).split("\n")[0]).toBe("日期,星期,上班,下班,工时,状态,备注");
  });

  it("一条完整记录", () => {
    const csv = toCsv([
      cell({
        date: "2026-09-15",
        record: { date: "2026-09-15", in: "09:30", out: "18:30", status: "normal", updatedAt: "" },
        workedMinutes: 540,
      }),
    ]);
    expect(csv.split("\n")[1]).toBe("2026-09-15,周二,09:30,18:30,9.0,正常,");
  });

  it("没有记录的日子留空", () => {
    const csv = toCsv([cell({ date: "2026-09-16" })]);
    expect(csv.split("\n")[1]).toBe("2026-09-16,周三,,,,,");
  });

  it("备注里的逗号和引号会被转义", () => {
    const csv = toCsv([
      cell({
        date: "2026-09-15",
        record: {
          date: "2026-09-15",
          in: "09:30",
          out: "18:30",
          note: '外出开会,见"客户"',
          status: "normal",
          updatedAt: "",
        },
        workedMinutes: 540,
      }),
    ]);
    expect(csv.split("\n")[1]).toContain('"外出开会,见""客户"""');
  });

  it("请假的日子写状态", () => {
    const csv = toCsv([
      cell({ date: "2026-09-15", record: { date: "2026-09-15", status: "leave", updatedAt: "" } }),
    ]);
    expect(csv.split("\n")[1]).toBe("2026-09-15,周二,,,,请假,");
  });
});
