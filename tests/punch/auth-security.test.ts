import { describe, it, expect, beforeEach, vi } from "vitest";

const mem = new Map<string, unknown>();
const ttl = new Map<string, number>();

const fakeRedis = {
  get: vi.fn(async (k: string) => (mem.has(k) ? mem.get(k) : null)),
  set: vi.fn(async (k: string, v: unknown) => {
    mem.set(k, v);
    return "OK";
  }),
  del: vi.fn(async (k: string) => {
    const had = mem.has(k);
    mem.delete(k);
    ttl.delete(k);
    return had ? 1 : 0;
  }),
  mget: vi.fn(async (keys: string[]) => keys.map((k) => (mem.has(k) ? mem.get(k) : null))),
  incr: vi.fn(async (k: string) => {
    const cur = ((mem.get(k) as number) ?? 0) + 1;
    mem.set(k, cur);
    return cur;
  }),
  expire: vi.fn(async (k: string, seconds: number) => {
    ttl.set(k, seconds);
    return 1;
  }),
};

vi.mock("@/lib/punch/redis", () => ({ getRedis: () => fakeRedis }));

import { bumpAuthFail, getAuthFail, clearAuthFail } from "@/lib/punch/store";
import { timingSafeEqual } from "@/lib/punch/session";

beforeEach(() => {
  mem.clear();
  ttl.clear();
  vi.clearAllMocks();
});

describe("登录失败计数", () => {
  it("连续调用会递增", async () => {
    expect(await bumpAuthFail("1.2.3.4")).toBe(1);
    expect(await bumpAuthFail("1.2.3.4")).toBe(2);
    expect(await bumpAuthFail("1.2.3.4")).toBe(3);
  });

  it("每次自增都续 TTL", async () => {
    await bumpAuthFail("1.2.3.4");
    expect(fakeRedis.expire).toHaveBeenCalledWith("punch:authfail:1.2.3.4", 15 * 60);
  });

  it("clearAuthFail 之后计数归零", async () => {
    await bumpAuthFail("1.2.3.4");
    await bumpAuthFail("1.2.3.4");
    await clearAuthFail("1.2.3.4");
    expect(await getAuthFail("1.2.3.4")).toBe(0);
  });

  it("没记录的 IP 返回 0", async () => {
    expect(await getAuthFail("9.9.9.9")).toBe(0);
  });

  it("不同 IP 互不影响", async () => {
    await bumpAuthFail("1.1.1.1");
    await bumpAuthFail("1.1.1.1");
    await bumpAuthFail("2.2.2.2");
    expect(await getAuthFail("1.1.1.1")).toBe(2);
    expect(await getAuthFail("2.2.2.2")).toBe(1);
  });
});

describe("timingSafeEqual", () => {
  it("相同串返回 true", () => {
    expect(timingSafeEqual("abc123", "abc123")).toBe(true);
  });

  it("不同串返回 false", () => {
    expect(timingSafeEqual("abc123", "abc124")).toBe(false);
  });

  it("长度不同返回 false", () => {
    expect(timingSafeEqual("abc", "abcd")).toBe(false);
  });
});
