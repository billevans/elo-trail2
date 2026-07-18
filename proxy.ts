import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  hasDashboardCredentialsConfigured,
  isDashboardAuthorised,
} from "@/services/observability/dashboard/dashboard-auth";

const DASHBOARD_REALM = "ELO Trail Operations";

export function proxy(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (
    hasDashboardCredentialsConfigured() &&
    isDashboardAuthorised(authorization)
  ) {
    return NextResponse.next();
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "Cache-Control": "no-store",
      "WWW-Authenticate": `Basic realm="${DASHBOARD_REALM}", charset="UTF-8"`,
    },
  });
}

export const config = {
  matcher: ["/admin/observability/:path*"],
};
