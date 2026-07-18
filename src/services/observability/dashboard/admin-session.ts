import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "elo_trail_admin_session";
export const ADMIN_SESSION_DURATION_SECONDS = 8 * 60 * 60;

const SESSION_VERSION = "v1";

export type AdminSession = {
  username: string;
  expiresAt: number;
};

function getSessionSecret(): string | null {
  const secret = process.env.OBSERVABILITY_SESSION_SECRET?.trim();

  return secret ? secret : null;
}

export function hasAdminSessionSecretConfigured(): boolean {
  return getSessionSecret() !== null;
}

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safelyCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function createAdminSessionToken(
  username: string,
  now = new Date(),
): string {
  const secret = getSessionSecret();

  if (!secret) {
    throw new Error("OBSERVABILITY_SESSION_SECRET is not configured.");
  }

  const normalisedUsername = username.trim();

  if (!normalisedUsername) {
    throw new Error("Admin session username is required.");
  }

  const expiresAt =
    Math.floor(now.getTime() / 1000) + ADMIN_SESSION_DURATION_SECONDS;

  const encodedUsername = Buffer.from(normalisedUsername).toString("base64url");

  const payload = [SESSION_VERSION, expiresAt.toString(), encodedUsername].join(
    ".",
  );

  const signature = signPayload(payload, secret);

  return `${payload}.${signature}`;
}

export function verifyAdminSessionToken(
  token: string | null | undefined,
  now = new Date(),
): AdminSession | null {
  const secret = getSessionSecret();

  if (!secret || !token) {
    return null;
  }

  const parts = token.split(".");

  if (parts.length !== 4) {
    return null;
  }

  const [version, expiresAtText, encodedUsername, signature] = parts;

  if (
    version !== SESSION_VERSION ||
    !expiresAtText ||
    !encodedUsername ||
    !signature
  ) {
    return null;
  }

  const expiresAt = Number(expiresAtText);

  if (!Number.isSafeInteger(expiresAt)) {
    return null;
  }

  const nowSeconds = Math.floor(now.getTime() / 1000);

  if (expiresAt <= nowSeconds) {
    return null;
  }

  const payload = [version, expiresAtText, encodedUsername].join(".");
  const expectedSignature = signPayload(payload, secret);

  if (!safelyCompare(signature, expectedSignature)) {
    return null;
  }

  try {
    const username = Buffer.from(encodedUsername, "base64url").toString("utf8");

    if (!username.trim()) {
      return null;
    }

    return {
      username,
      expiresAt,
    };
  } catch {
    return null;
  }
}
