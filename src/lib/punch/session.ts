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
  // 定长比较，避免因长度差异提前返回
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  if (diff !== 0) return false;

  return expiresAt > nowMs;
}
