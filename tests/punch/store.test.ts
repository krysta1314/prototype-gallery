import { describe, it, expect, beforeEach, vi } from "vitest";

const mem = new Map<string, unknown>();

const fakeRedis = {
  get: vi.fn(async (k: string) => (mem.has(k) ? mem.get(k) : null)),
  set: vi.fn(async (k: string, v: unknown) => {
    mem.set(k, v);
    return "OK";
  }),
  del: vi.fn(async (k: string) => {
    const had = mem.has(k);
    mem.delete(k);
    return had ? 1 : 0;
  }),
  mget: vi.fn(async (keys: string[]) => keys.map((k) => (mem.has(k) ? mem.get(k) : null))),
};

vi.mock("@/lib/punch/redis", () => ({ getRedis: () => fakeRedis }));

import {
  getDay,
  putDay,
  listMonth,
  getSettings,
  putSettings,
  getSub,
  putSub,
  delSub,
  getJobId,
  putJobId,
  delJobId,
} from "@/lib/punch/store";
import { DEFAULT_SETTINGS, type DayRecord } from "@/lib/punch/types";

const rec = (date: string, p: Partial<DayRecord> = {}): DayRecord => ({
  date,
  status: "normal",
  updatedAt: "2026-09-15T00:00:00.000Z",
  ...p,
});

beforeEach(() => {
  mem.clear();
  vi.clearAllMocks();
});

describe("按天记录", () => {
  it("写进去能读出来", async () => {
    await putDay(rec("2026-09-15", { in: "09:30" }));
    const got = await getDay("2026-09-15");
    expect(got?.in).toBe("09:30");
  });

  it("没写过的日子返回 null", async () => {
    expect(await getDay("2026-09-15")).toBeNull();
  });

  it("key 前缀是 punch:day:", async () => {
    await putDay(rec("2026-09-15"));
    expect(mem.has("punch:day:2026-09-15")).toBe(true);
  });
});

describe("按月列表", () => {
  it("用一次 mget 取整月，只返回存在的记录", async () => {
    await putDay(rec("2026-09-01", { in: "09:30" }));
    await putDay(rec("2026-09-15", { in: "09:40" }));

    const list = await listMonth(2026, 9);

    expect(list).toHaveLength(2);
    expect(list.map((r) => r.date)).toEqual(["2026-09-01", "2026-09-15"]);
    expect(fakeRedis.mget).toHaveBeenCalledTimes(1);
    expect((fakeRedis.mget.mock.calls[0][0] as string[])).toHaveLength(30);
  });

  it("整月都没记录时返回空数组", async () => {
    expect(await listMonth(2026, 9)).toEqual([]);
  });

  it("结果按日期升序", async () => {
    await putDay(rec("2026-09-20"));
    await putDay(rec("2026-09-03"));
    const list = await listMonth(2026, 9);
    expect(list.map((r) => r.date)).toEqual(["2026-09-03", "2026-09-20"]);
  });
});

describe("设置", () => {
  it("没存过时返回默认值", async () => {
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it("存过之后返回存的值", async () => {
    await putSettings({ clockInDeadline: "09:30", workMinutes: 480, morningReminder: "09:20" });
    const s = await getSettings();
    expect(s.workMinutes).toBe(480);
  });

  it("存的值缺字段时用默认值补齐", async () => {
    mem.set("punch:settings", { workMinutes: 480 });
    const s = await getSettings();
    expect(s.workMinutes).toBe(480);
    expect(s.clockInDeadline).toBe(DEFAULT_SETTINGS.clockInDeadline);
    expect(s.morningReminder).toBe(DEFAULT_SETTINGS.morningReminder);
  });
});

describe("推送订阅", () => {
  it("存、读、删", async () => {
    await putSub({ endpoint: "https://x", keys: { p256dh: "a", auth: "b" } });
    expect((await getSub())?.endpoint).toBe("https://x");
    await delSub();
    expect(await getSub()).toBeNull();
  });
});

describe("QStash 任务 id", () => {
  it("存、读、删", async () => {
    await putJobId("2026-09-15", "msg_123");
    expect(await getJobId("2026-09-15")).toBe("msg_123");
    await delJobId("2026-09-15");
    expect(await getJobId("2026-09-15")).toBeNull();
  });
});
