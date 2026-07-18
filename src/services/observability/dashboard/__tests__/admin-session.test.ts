import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ADMIN_SESSION_DURATION_SECONDS,
  createAdminSessionToken,
  hasAdminSessionSecretConfigured,
  verifyAdminSessionToken,
} from "../admin-session";

describe("admin session", () => {
  const now = new Date("2026-07-18T12:00:00.000Z");

  beforeEach(() => {
    vi.stubEnv(
      "OBSERVABILITY_SESSION_SECRET",
      "test-session-secret-that-is-long-enough",
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reports whether the session secret is configured", () => {
    expect(hasAdminSessionSecretConfigured()).toBe(true);

    vi.stubEnv("OBSERVABILITY_SESSION_SECRET", "");

    expect(hasAdminSessionSecretConfigured()).toBe(false);
  });

  it("creates and verifies a valid session", () => {
    const token = createAdminSessionToken("admin", now);
    const session = verifyAdminSessionToken(token, now);

    expect(session).toEqual({
      username: "admin",
      expiresAt:
        Math.floor(now.getTime() / 1000) + ADMIN_SESSION_DURATION_SECONDS,
    });
  });

  it("rejects a modified session", () => {
    const token = createAdminSessionToken("admin", now);
    const modifiedToken = `${token.slice(0, -1)}x`;

    expect(verifyAdminSessionToken(modifiedToken, now)).toBeNull();
  });

  it("rejects an expired session", () => {
    const token = createAdminSessionToken("admin", now);

    const afterExpiry = new Date(
      now.getTime() + (ADMIN_SESSION_DURATION_SECONDS + 1) * 1000,
    );

    expect(verifyAdminSessionToken(token, afterExpiry)).toBeNull();
  });

  it("rejects malformed sessions", () => {
    expect(verifyAdminSessionToken("invalid", now)).toBeNull();
    expect(verifyAdminSessionToken("", now)).toBeNull();
    expect(verifyAdminSessionToken(null, now)).toBeNull();
  });

  it("fails closed when the secret is unavailable", () => {
    const token = createAdminSessionToken("admin", now);

    vi.stubEnv("OBSERVABILITY_SESSION_SECRET", "");

    expect(verifyAdminSessionToken(token, now)).toBeNull();
  });
});
