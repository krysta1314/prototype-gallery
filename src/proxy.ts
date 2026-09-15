import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/punch/session";

/** 这些路径不需要 cookie：登录页、登录接口，以及走 QStash 签名校验的回调 */
const PUBLIC_PATHS = [
  "/punch/login",
  "/api/punch/auth",
  "/api/punch/notify",
  "/api/punch/notify-morning",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const secret = process.env.PUNCH_SESSION_SECRET;
  const token = request.cookies.get(SESSION_COOKIE)?.value;

  if (secret && token && (await verifySession(token, secret))) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const url = request.nextUrl.clone();
  url.pathname = "/punch/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/punch/:path*", "/api/punch/:path*"],
};
