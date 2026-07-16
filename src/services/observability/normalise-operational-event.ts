import type { OperationalEventInput, OperationalEventName } from "./types";
import { OPERATIONAL_EVENT_NAMES } from "./types";

const MAX_ROUTE_LENGTH = 200;
const MAX_CODE_LENGTH = 100;
const MAX_CACHE_SOURCE_LENGTH = 100;
const MAX_METADATA_KEYS = 20;
const MAX_METADATA_STRING_LENGTH = 250;

const eventNames = new Set<string>(OPERATIONAL_EVENT_NAMES);

function isFiniteInteger(value: number | undefined): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isInteger(value)
  );
}

function normaliseOptionalInteger(
  value: number | undefined,
  minimum: number,
  maximum: number,
): number | undefined {
  if (!isFiniteInteger(value)) {
    return undefined;
  }

  if (value < minimum || value > maximum) {
    return undefined;
  }

  return value;
}

function normaliseText(
  value: string | undefined,
  maximumLength: number,
): string | undefined {
  const normalised = value?.trim();

  if (!normalised) {
    return undefined;
  }

  return normalised.slice(0, maximumLength);
}

function normaliseMetadata(
  metadata: OperationalEventInput["metadata"] | undefined,
): Record<string, string | number | boolean | null> | undefined {
  if (!metadata) {
    return undefined;
  }

  const entries = Object.entries(metadata).slice(0, MAX_METADATA_KEYS);

  const safeEntries = entries.map(([key, value]) => {
    const safeKey = key.trim().slice(0, MAX_CODE_LENGTH);

    const safeValue =
      typeof value === "string"
        ? value.slice(0, MAX_METADATA_STRING_LENGTH)
        : value;

    return [safeKey, safeValue] as const;
  });

  return Object.fromEntries(safeEntries);
}

export function isOperationalEventName(
  value: string,
): value is OperationalEventName {
  return eventNames.has(value);
}

export function normaliseOperationalEvent(
  input: OperationalEventInput,
): OperationalEventInput {
  if (!isOperationalEventName(input.eventName)) {
    throw new Error("Unknown operational event name.");
  }

  return {
    eventName: input.eventName,

    route: normaliseText(input.route, MAX_ROUTE_LENGTH),

    statusCode: normaliseOptionalInteger(input.statusCode, 100, 599),

    durationMs: normaliseOptionalInteger(input.durationMs, 0, 60 * 60 * 1000),

    profileId: normaliseOptionalInteger(
      input.profileId,
      1,
      Number.MAX_SAFE_INTEGER,
    ),

    historyDays: normaliseOptionalInteger(input.historyDays, 1, 180),

    cacheSource: normaliseText(input.cacheSource, MAX_CACHE_SOURCE_LENGTH),

    upstreamGames: normaliseOptionalInteger(input.upstreamGames, 0, 2_000),

    returnedGames: normaliseOptionalInteger(input.returnedGames, 0, 2_000),

    errorCode: normaliseText(input.errorCode, MAX_CODE_LENGTH),

    metadata: normaliseMetadata(input.metadata),
  };
}
