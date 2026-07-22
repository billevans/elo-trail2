import { ChevronRight } from "lucide-react";

import type { Aoe4WorldPlayer } from "@/services/aoe4world";

interface PlayerCardProps {
  player: Aoe4WorldPlayer;
  isSelected?: boolean;
  onSelect: (player: Aoe4WorldPlayer) => void;
}

export function PlayerCard({
  player,
  isSelected = false,
  onSelect,
}: PlayerCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(player)}
      className={[
        "w-full rounded-xl border p-4 text-left transition-all",
        "hover:-translate-y-0.5 hover:shadow-md",
        "focus-visible:ring-2 focus-visible:ring-black/40 focus-visible:ring-offset-2 focus-visible:outline-none",
        "dark:focus-visible:ring-white/50 dark:focus-visible:ring-offset-black",
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
              "mt-1 text-sm",
              isSelected
                ? "text-white/65 dark:text-black/65"
                : "text-black/55 dark:text-white/55",
            ].join(" ")}
          >
            Profile #{player.profile_id}
          </p>

          <p
            className={[
              "mt-3 text-sm",
              isSelected
                ? "text-white/75 dark:text-black/75"
                : "text-black/60 dark:text-white/60",
            ].join(" ")}
          >
            View matchmaking ELO history
          </p>
        </div>

        <ChevronRight className="size-5 shrink-0" aria-hidden="true" />
      </div>
    </button>
  );
}
