import { NextRequest, NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/services/observability/dashboard/admin-session";

const LOGIN_PATH = "/admin/login";

function createLoginUrl(request: NextRequest): URL {
  const loginUrl = new URL(LOGIN_PATH, request.url);

  const destination = `${request.nextUrl.pathname}${request.nextUrl.search}`;

  loginUrl.searchParams.set("next", destination);

  return loginUrl;
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

  const session = verifyAdminSessionToken(token);

  if (!session) {
    const response = NextResponse.redirect(createLoginUrl(request));

    response.headers.set("Cache-Control", "private, no-store, max-age=0");

    return response;
  }

  const response = NextResponse.next();

  response.headers.set("Cache-Control", "private, no-store, max-age=0");

  return response;
}

export const config = {
  matcher: ["/admin/observability/:path*"],
};
