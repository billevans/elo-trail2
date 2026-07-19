import { NextRequest, NextResponse } from "next/server";

import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_DURATION_SECONDS,
  createAdminSessionToken,
  hasAdminSessionSecretConfigured,
  hasDashboardCredentialsConfigured,
  isDashboardAuthorised,
} from "@/services/observability/dashboard";

const LOGIN_PATH = "/admin/login";
const DASHBOARD_PATH = "/admin/observability";

function getPublicOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return request.nextUrl.origin;
}

function getFormValue(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function getSafeDestination(value: string): string {
  if (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\")
  ) {
    return value;
  }

  return DASHBOARD_PATH;
}

function createLoginUrl(
  request: NextRequest,
  error: string,
  destination: string,
): URL {
  const url = new URL(LOGIN_PATH, request.url);

  url.searchParams.set("error", error);
  url.searchParams.set("next", destination);

  return url;
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const username = getFormValue(formData, "username");
  const password = getFormValue(formData, "password");
  const destination = getSafeDestination(getFormValue(formData, "next"));

  if (
    !hasDashboardCredentialsConfigured() ||
    !hasAdminSessionSecretConfigured()
  ) {
    return NextResponse.redirect(
      createLoginUrl(request, "configuration", destination),
      303,
    );
  }

  const basicCredentials = Buffer.from(`${username}:${password}`).toString(
    "base64",
  );

  const authorised = isDashboardAuthorised(`Basic ${basicCredentials}`);

  if (!authorised) {
    return NextResponse.redirect(
      createLoginUrl(request, "invalid", destination),
      303,
    );
  }

  const token = createAdminSessionToken(username);

  const response = NextResponse.redirect(
    new URL(destination, getPublicOrigin(request)),
    303,
  );

  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_SESSION_DURATION_SECONDS,
  });

  response.headers.set("Cache-Control", "private, no-store, max-age=0");

  return response;
}
