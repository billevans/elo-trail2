import type { Prisma } from "@prisma/client";

import { downsampleEloPoints } from "@/features/leaderboard/lib/homepage-leaderboard";
import type {
  HomepageLeaderboardData,
  HomepageLeaderboardPlayer,
} from "@/features/leaderboard/types/homepage-leaderboard";
import { getTopRmOneVOneEloPlayers } from "@/services/aoe4world/leaderboard-dump";
import { getPlayerGames } from "@/services/aoe4world/history";
import { buildEloHistory } from "@/services/aoe4world/timeline";
import { prisma } from "@/services/database/prisma";

export const HOMEPAGE_LEADERBOARD_KEY = "rm-1v1-elo-top-8-90d";

const HISTORY_DAYS = 90;
const HISTORY_PAGE_SIZE = 50;
const HISTORY_MAX_PAGES = 40;
const PLAYER_BATCH_SIZE = 2;

function getSinceDate(): string {
  const date = new Date();

  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - HISTORY_DAYS);

  return date.toISOString();
}

async function buildSnapshotPlayer(
  player: Awaited<ReturnType<typeof getTopRmOneVOneEloPlayers>>[number],
  since: string,
): Promise<HomepageLeaderboardPlayer> {
  const games = await getPlayerGames(player.profileId, {
    leaderboard: "rm_1v1",
    since,
    pageSize: HISTORY_PAGE_SIZE,
    maxPages: HISTORY_MAX_PAGES,
  });

  const history = buildEloHistory(player.profileId, games, "rm_1v1");

  return {
    rank: player.rank,
    profileId: player.profileId,
    name: player.name,
    country: player.country,
    currentElo: player.rating,
    gamesInWindow: history.matches.length,
    points: downsampleEloPoints(history.points),
  };
}

export async function refreshHomepageLeaderboard(): Promise<HomepageLeaderboardData> {
  const topPlayers = await getTopRmOneVOneEloPlayers();

  const since = getSinceDate();

  const players: HomepageLeaderboardPlayer[] = [];

  /*
   * Refresh two players at a time. Each player's internal
   * history pagination is already limited to two concurrent
   * page requests.
   */
  for (let index = 0; index < topPlayers.length; index += PLAYER_BATCH_SIZE) {
    const batch = topPlayers.slice(index, index + PLAYER_BATCH_SIZE);

    const results = await Promise.all(
      batch.map((player) => buildSnapshotPlayer(player, since)),
    );

    players.push(...results);
  }

  players.sort((left, right) => left.rank - right.rank);

  const generatedAt = new Date();

  const snapshot: HomepageLeaderboardData = {
    key: HOMEPAGE_LEADERBOARD_KEY,
    generatedAt: generatedAt.toISOString(),
    source: "AoE4World RM 1v1 Elo dump and player game history",
    historyDays: HISTORY_DAYS,
    players,
  };

  await prisma.homepageLeaderboardSnapshot.upsert({
    where: {
      key: HOMEPAGE_LEADERBOARD_KEY,
    },

    create: {
      key: HOMEPAGE_LEADERBOARD_KEY,
      generatedAt,
      source: snapshot.source,
      data: snapshot as unknown as Prisma.InputJsonValue,
    },

    update: {
      generatedAt,
      source: snapshot.source,
      data: snapshot as unknown as Prisma.InputJsonValue,
    },
  });

  return snapshot;
}
