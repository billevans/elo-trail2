import { timingSafeEqual } from "node:crypto";

const BASIC_PREFIX = "Basic ";

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function decodeBasicCredentials(authorization: string): {
  username: string;
  password: string;
} | null {
  if (!authorization.startsWith(BASIC_PREFIX)) {
    return null;
  }

  try {
    const encodedCredentials = authorization.slice(BASIC_PREFIX.length);

    const decodedCredentials = Buffer.from(
      encodedCredentials,
      "base64",
    ).toString("utf8");

    const separatorIndex = decodedCredentials.indexOf(":");

    if (separatorIndex < 0) {
      return null;
    }

    return {
      username: decodedCredentials.slice(0, separatorIndex),
      password: decodedCredentials.slice(separatorIndex + 1),
    };
  } catch {
    return null;
  }
}

export function hasDashboardCredentialsConfigured(): boolean {
  return Boolean(
    process.env.OBSERVABILITY_DASHBOARD_USERNAME &&
    process.env.OBSERVABILITY_DASHBOARD_PASSWORD,
  );
}

export function isDashboardAuthorised(
  authorization: string | null | undefined,
): boolean {
  const expectedUsername = process.env.OBSERVABILITY_DASHBOARD_USERNAME;

  const expectedPassword = process.env.OBSERVABILITY_DASHBOARD_PASSWORD;

  if (!expectedUsername || !expectedPassword || !authorization) {
    return false;
  }

  const credentials = decodeBasicCredentials(authorization);

  if (!credentials) {
    return false;
  }

  return (
    safeEqual(credentials.username, expectedUsername) &&
    safeEqual(credentials.password, expectedPassword)
  );
}
