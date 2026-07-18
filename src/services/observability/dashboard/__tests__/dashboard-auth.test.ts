import { afterEach, describe, expect, it, vi } from "vitest";

import {
  hasDashboardCredentialsConfigured,
  isDashboardAuthorised,
} from "../dashboard-auth";

function createAuthorization(username: string, password: string): string {
  return `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;
}

describe("dashboard authorization", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("reports whether dashboard credentials are configured", () => {
    vi.stubEnv("OBSERVABILITY_DASHBOARD_USERNAME", "");
    vi.stubEnv("OBSERVABILITY_DASHBOARD_PASSWORD", "");

    expect(hasDashboardCredentialsConfigured()).toBe(false);

    vi.stubEnv("OBSERVABILITY_DASHBOARD_USERNAME", "admin");
    vi.stubEnv("OBSERVABILITY_DASHBOARD_PASSWORD", "secret");

    expect(hasDashboardCredentialsConfigured()).toBe(true);
  });

  it("accepts matching basic credentials", () => {
    vi.stubEnv("OBSERVABILITY_DASHBOARD_USERNAME", "admin");
    vi.stubEnv("OBSERVABILITY_DASHBOARD_PASSWORD", "secret");

    expect(isDashboardAuthorised(createAuthorization("admin", "secret"))).toBe(
      true,
    );
  });

  it("rejects missing or malformed authorization", () => {
    vi.stubEnv("OBSERVABILITY_DASHBOARD_USERNAME", "admin");
    vi.stubEnv("OBSERVABILITY_DASHBOARD_PASSWORD", "secret");

    expect(isDashboardAuthorised(null)).toBe(false);
    expect(isDashboardAuthorised("Bearer token")).toBe(false);
    expect(isDashboardAuthorised("Basic invalid")).toBe(false);
  });

  it("rejects incorrect credentials", () => {
    vi.stubEnv("OBSERVABILITY_DASHBOARD_USERNAME", "admin");
    vi.stubEnv("OBSERVABILITY_DASHBOARD_PASSWORD", "secret");

    expect(isDashboardAuthorised(createAuthorization("admin", "wrong"))).toBe(
      false,
    );

    expect(isDashboardAuthorised(createAuthorization("wrong", "secret"))).toBe(
      false,
    );
  });

  it("fails closed when credentials are not configured", () => {
    expect(isDashboardAuthorised(createAuthorization("admin", "secret"))).toBe(
      false,
    );
  });
});
