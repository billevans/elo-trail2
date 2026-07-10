import { ChevronRight } from "lucide-react";

import type { Aoe4WorldPlayer } from "@/services/aoe4world";

interface PlayerCardProps {
  player: Aoe4WorldPlayer;
  isSelected?: boolean;
  onSelect: (player: Aoe4WorldPlayer) => void;
}

function getPrimaryLeaderboard(player: Aoe4WorldPlayer) {
  const leaderboards = player.leaderboards;

  if (!leaderboards) {
    return null;
  }

  const preferredKeys = ["rm_1v1", "rm_solo", "qm_1v1"];

  for (const key of preferredKeys) {
    const leaderboard = leaderboards[key];

    if (typeof leaderboard?.rating === "number") {
      return {
        key,
        leaderboard,
      };
    }
  }

  const fallback = Object.entries(leaderboards).find(
    ([, leaderboard]) => typeof leaderboard.rating === "number",
  );

  if (!fallback) {
    return null;
  }

  const [key, leaderboard] = fallback;

  return {
    key,
    leaderboard,
  };
}

function formatLeaderboardName(key: string) {
  const labels: Record<string, string> = {
    rm_solo: "Ranked Solo",
    rm_team: "Ranked Team",
    rm_1v1: "Ranked 1v1",
    rm_2v2: "Ranked 2v2",
    rm_3v3: "Ranked 3v3",
    rm_4v4: "Ranked 4v4",
    qm_1v1: "Quick Match 1v1",
    qm_2v2: "Quick Match 2v2",
    qm_3v3: "Quick Match 3v3",
    qm_4v4: "Quick Match 4v4",
  };

  return labels[key] ?? key.replaceAll("_", " ");
}

export function PlayerCard({
  player,
  isSelected = false,
  onSelect,
}: PlayerCardProps) {
  const primaryLeaderboard = getPrimaryLeaderboard(player);

  return (
    <button
      type="button"
      onClick={() => onSelect(player)}
      className={[
        "w-full rounded-xl border p-4 text-left transition-all",
        "hover:-translate-y-0.5 hover:shadow-md",
        isSelected
          ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
          : "border-black/10 bg-white dark:border-white/10 dark:bg-white/5",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold">{player.name}</h3>

          <p
            className={[
              "mt-0.5 text-sm",
              isSelected
                ? "text-white/65 dark:text-black/65"
                : "text-black/55 dark:text-white/55",
            ].join(" ")}
          >
            Profile #{player.profile_id}
            {player.country ? ` · ${player.country}` : ""}
          </p>

          {primaryLeaderboard && (
            <div className="mt-3 flex flex-wrap items-baseline gap-x-2">
              <span className="text-xl font-semibold">
                {primaryLeaderboard.leaderboard.rating?.toLocaleString()}
              </span>

              <span
                className={[
                  "text-sm",
                  isSelected
                    ? "text-white/65 dark:text-black/65"
                    : "text-black/55 dark:text-white/55",
                ].join(" ")}
              >
                {formatLeaderboardName(primaryLeaderboard.key)}
                {typeof primaryLeaderboard.leaderboard.rank === "number"
                  ? ` · Rank #${primaryLeaderboard.leaderboard.rank.toLocaleString()}`
                  : ""}
              </span>
            </div>
          )}
        </div>

        <ChevronRight className="size-5 shrink-0" aria-hidden="true" />
      </div>
    </button>
  );
}
