import { describe, it, expect } from "vitest";
import { signSession, verifySession } from "@/lib/punch/session";

const SECRET = "test-secret-do-not-use-in-production";
const NOW = Date.parse("2026-09-15T00:00:00Z");
const LATER = NOW + 86400_000;

describe("会话签名", () => {
  it("自己签的自己能验过", async () => {
    const t = await signSession(LATER, SECRET);
    expect(await verifySession(t, SECRET, NOW)).toBe(true);
  });

  it("过期的验不过", async () => {
    const t = await signSession(NOW - 1, SECRET);
    expect(await verifySession(t, SECRET, NOW)).toBe(false);
  });

  it("换了密钥验不过", async () => {
    const t = await signSession(LATER, SECRET);
    expect(await verifySession(t, "另一个密钥", NOW)).toBe(false);
  });

  it("篡改过期时间后验不过", async () => {
    const t = await signSession(NOW - 1, SECRET);
    const tampered = `${LATER}.${t.split(".")[1]}`;
    expect(await verifySession(tampered, SECRET, NOW)).toBe(false);
  });

  it("格式不对的 token 不抛错，返回 false", async () => {
    for (const bad of ["", "abc", "abc.def.ghi", "notanumber.sig"]) {
      expect(await verifySession(bad, SECRET, NOW)).toBe(false);
    }
  });
});
