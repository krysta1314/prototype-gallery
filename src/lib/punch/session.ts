export const SESSION_COOKIE = "punch_session";
export const SESSION_MAX_AGE = 365 * 24 * 60 * 60;

const enc = new TextEncoder();

async function hmac(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** 定长比较，避免因提前返回而泄露内容差异；长度不同直接返回 false（长度信息泄露在此场景可接受） */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** token 形如 "<过期毫秒时间戳>.<HMAC 十六进制>" */
export async function signSession(expiresAtMs: number, secret: string): Promise<string> {
  const payload = String(expiresAtMs);
  return `${payload}.${await hmac(payload, secret)}`;
}

export async function verifySession(
  token: string,
  secret: string,
  nowMs: number = Date.now()
): Promise<boolean> {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt)) return false;

  const expected = await hmac(payload, secret);
  if (!timingSafeEqual(expected, sig)) return false;

  return expiresAt > nowMs;
}
