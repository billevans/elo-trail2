import { OBSERVABILITY_WINDOWS, type ObservabilityWindow } from "./types";

const WINDOW_DURATION_MS: Record<ObservabilityWindow, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

export function isObservabilityWindow(
  value: string,
): value is ObservabilityWindow {
  return OBSERVABILITY_WINDOWS.some((window) => window === value);
}

export function normaliseObservabilityWindow(
  value: string | null | undefined,
): ObservabilityWindow {
  if (value && isObservabilityWindow(value)) {
    return value;
  }

  return "24h";
}

export function getObservabilityWindowStart(
  window: ObservabilityWindow,
  now = new Date(),
): Date {
  return new Date(now.getTime() - WINDOW_DURATION_MS[window]);
}
