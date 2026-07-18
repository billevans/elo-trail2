import { describe, expect, it } from "vitest";

import {
  getObservabilityWindowStart,
  isObservabilityWindow,
  normaliseObservabilityWindow,
} from "../reporting-window";

describe("observability reporting windows", () => {
  it("recognises supported windows", () => {
    expect(isObservabilityWindow("24h")).toBe(true);
    expect(isObservabilityWindow("7d")).toBe(true);
    expect(isObservabilityWindow("30d")).toBe(true);
    expect(isObservabilityWindow("90d")).toBe(false);
  });

  it("defaults unsupported values to 24 hours", () => {
    expect(normaliseObservabilityWindow(undefined)).toBe("24h");
    expect(normaliseObservabilityWindow(null)).toBe("24h");
    expect(normaliseObservabilityWindow("invalid")).toBe("24h");
  });

  it("calculates the start of a reporting window", () => {
    const now = new Date("2026-07-18T12:00:00.000Z");

    expect(getObservabilityWindowStart("24h", now).toISOString()).toBe(
      "2026-07-17T12:00:00.000Z",
    );

    expect(getObservabilityWindowStart("7d", now).toISOString()).toBe(
      "2026-07-11T12:00:00.000Z",
    );

    expect(getObservabilityWindowStart("30d", now).toISOString()).toBe(
      "2026-06-18T12:00:00.000Z",
    );
  });
});
