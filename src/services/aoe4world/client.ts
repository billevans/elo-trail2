import {
  AOE4WORLD_API,
  AOE4WORLD_CACHE_SECONDS,
  AOE4WORLD_REQUEST_TIMEOUT_MS,
  AOE4WORLD_USER_AGENT,
} from "@/lib/constants";

export class Aoe4WorldRequestError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly retryAfter?: string | null,
  ) {
    super(message);
  }
}

export async function aoe4Request<T>(endpoint: string): Promise<T> {
  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, AOE4WORLD_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${AOE4WORLD_API}${endpoint}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": AOE4WORLD_USER_AGENT,
      },

      signal: controller.signal,

      next: {
        revalidate: AOE4WORLD_CACHE_SECONDS,
      },
    });

    if (response.status === 429) {
      throw new Aoe4WorldRequestError(
        "Rate limited",
        429,
        response.headers.get("Retry-After"),
      );
    }

    if (!response.ok) {
      throw new Aoe4WorldRequestError(
        `AoE4World API error ${response.status}`,
        response.status,
      );
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}
