import type { PlayerGamesOptions } from "@/types/history";

import { aoe4Request } from "./client";
import type { Aoe4WorldGame, Aoe4WorldGamesResponse } from "./history-types";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 50;

/*
 * Forty pages allows up to 2,000 games in a 180-day
 * window while preventing unbounded extraction.
 */
const DEFAULT_MAX_PAGES = 40;
const MAX_ALLOWED_PAGES = 40;

/*
 * Keep upstream pressure low, especially when comparing
 * two players at the same time.
 */
const PAGE_CONCURRENCY = 2;

type NormalisedPlayerGamesOptions = Required<
  Pick<PlayerGamesOptions, "pageSize" | "maxPages">
> &
  Pick<PlayerGamesOptions, "leaderboard" | "since">;

function getGameKey(game: Aoe4WorldGame): string {
  if (game.game_id !== undefined) {
    return String(game.game_id);
  }

  if (game.id !== undefined) {
    return String(game.id);
  }

  return [
    game.started_at ?? "unknown-date",
    game.kind ?? "unknown-kind",
    game.map ?? game.map_name ?? "unknown-map",
  ].join(":");
}

function deduplicateGames(games: Aoe4WorldGame[]): Aoe4WorldGame[] {
  const uniqueGames = new Map<string, Aoe4WorldGame>();

  for (const game of games) {
    uniqueGames.set(getGameKey(game), game);
  }

  return [...uniqueGames.values()];
}

function buildGamesEndpoint(
  playerId: number,
  page: number,
  options: NormalisedPlayerGamesOptions,
): string {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(options.pageSize),
  });

  if (options.leaderboard) {
    params.set("leaderboard", options.leaderboard);
  }

  if (options.since) {
    params.set("since", options.since);
  }

  return `/players/${playerId}/games?${params.toString()}`;
}

async function getGamesPage(
  playerId: number,
  page: number,
  options: NormalisedPlayerGamesOptions,
): Promise<Aoe4WorldGamesResponse> {
  const response = await aoe4Request<Aoe4WorldGamesResponse | Aoe4WorldGame[]>(
    buildGamesEndpoint(playerId, page, options),
  );

  if (Array.isArray(response)) {
    return {
      page,
      per_page: options.pageSize,
      count: response.length,
      total_count: response.length,
      games: response,
    };
  }

  return response;
}

export async function getPlayerGames(
  playerId: number,
  options: PlayerGamesOptions = {},
): Promise<Aoe4WorldGame[]> {
  if (!Number.isInteger(playerId) || playerId <= 0) {
    throw new Error("A valid positive player profile ID is required");
  }

  const pageSize = Math.min(
    Math.max(Math.trunc(options.pageSize ?? DEFAULT_PAGE_SIZE), 1),
    MAX_PAGE_SIZE,
  );

  const maxPages = Math.min(
    Math.max(Math.trunc(options.maxPages ?? DEFAULT_MAX_PAGES), 1),
    MAX_ALLOWED_PAGES,
  );

  const requestOptions: NormalisedPlayerGamesOptions = {
    leaderboard: options.leaderboard,
    since: options.since,
    pageSize,
    maxPages,
  };

  const firstPage = await getGamesPage(playerId, 1, requestOptions);

  const firstPageGames = firstPage.games ?? [];

  const totalCount =
    typeof firstPage.total_count === "number"
      ? firstPage.total_count
      : firstPageGames.length;

  if (totalCount <= firstPageGames.length || firstPageGames.length === 0) {
    return deduplicateGames(firstPageGames);
  }

  const availablePages = Math.ceil(totalCount / pageSize);

  const requiredPages = Math.min(availablePages, maxPages);

  if (availablePages > maxPages) {
    console.warn("AoE4World history page limit reached", {
      playerId,
      totalCount,
      availablePages,
      maxPages,
    });
  }

  const allGames = [...firstPageGames];

  /*
   * Fetch only two pages concurrently to keep upstream
   * request pressure low.
   */
  for (
    let firstPageInBatch = 2;
    firstPageInBatch <= requiredPages;
    firstPageInBatch += PAGE_CONCURRENCY
  ) {
    const lastPageInBatch = Math.min(
      firstPageInBatch + PAGE_CONCURRENCY - 1,
      requiredPages,
    );

    const pageNumbers = Array.from(
      {
        length: lastPageInBatch - firstPageInBatch + 1,
      },
      (_, index) => firstPageInBatch + index,
    );

    const responses = await Promise.all(
      pageNumbers.map((page) => getGamesPage(playerId, page, requestOptions)),
    );

    for (const response of responses) {
      allGames.push(...(response.games ?? []));
    }
  }

  return deduplicateGames(allGames);
}
