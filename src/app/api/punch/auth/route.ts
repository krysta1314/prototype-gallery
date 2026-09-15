import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, timingSafeEqual } from "@/lib/punch/session";
import { AUTH_FAIL_MAX_ATTEMPTS, bumpAuthFail, clearAuthFail, getAuthFail } from "@/lib/punch/store";

export const runtime = "nodejs";

const UNKNOWN_IP = "unknown";

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (!forwarded) return UNKNOWN_IP;
  const first = forwarded.split(",")[0]?.trim();
  return first || UNKNOWN_IP;
}

export async function POST(request: Request) {
  const passcode = process.env.PUNCH_PASSCODE;
  const secret = process.env.PUNCH_SESSION_SECRET;
  if (!passcode || !secret) {
    return NextResponse.json({ error: "服务端未配置口令" }, { status: 500 });
  }

  const ip = clientIp(request);
  const failCount = await getAuthFail(ip);
  if (failCount >= AUTH_FAIL_MAX_ATTEMPTS) {
    return NextResponse.json({ error: "尝试次数过多，请 15 分钟后再试" }, { status: 429 });
  }

  let body: { passcode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  if (!timingSafeEqual(body.passcode ?? "", passcode)) {
    await bumpAuthFail(ip);
    return NextResponse.json({ error: "口令不对" }, { status: 401 });
  }

  await clearAuthFail(ip);

  const token = await signSession(Date.now() + SESSION_MAX_AGE * 1000, secret);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
