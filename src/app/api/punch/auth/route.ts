import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession } from "@/lib/punch/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const passcode = process.env.PUNCH_PASSCODE;
  const secret = process.env.PUNCH_SESSION_SECRET;
  if (!passcode || !secret) {
    return NextResponse.json({ error: "服务端未配置口令" }, { status: 500 });
  }

  let body: { passcode?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  if (body.passcode !== passcode) {
    return NextResponse.json({ error: "口令不对" }, { status: 401 });
  }

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
