import {
  Activity,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Crown,
  Gauge,
  Percent,
} from "lucide-react";

import type { EloStatistics } from "@/types/history";

interface HistoryStatCardsProps {
  statistics: EloStatistics;
}

function formatRating(value: number | null) {
  return value === null ? "—" : value.toLocaleString();
}

function formatWinRate(value: number | null) {
  return value === null ? "—" : `${value.toFixed(1)}%`;
}

function formatChange(value: number) {
  if (value > 0) {
    return `+${value.toLocaleString()}`;
  }

  return value.toLocaleString();
}

export function HistoryStatCards({ statistics }: HistoryStatCardsProps) {
  const isPositive = statistics.ratingChange > 0;
  const isNegative = statistics.ratingChange < 0;

  const ChangeIcon = isPositive ? ArrowUp : isNegative ? ArrowDown : Activity;

  const cards = [
    {
      label: "Current ELO",
      value: formatRating(statistics.currentRating),
      icon: Gauge,
    },
    {
      label: "Peak ELO",
      value: formatRating(statistics.peakRating),
      icon: Crown,
    },
    {
      label: "Lowest ELO",
      value: formatRating(statistics.lowestRating),
      icon: BarChart3,
    },
    {
      label: "Net change",
      value: formatChange(statistics.ratingChange),
      icon: ChangeIcon,
    },
    {
      label: "Games",
      value: statistics.games.toLocaleString(),
      icon: Activity,
    },
    {
      label: "Win rate",
      value: formatWinRate(statistics.winRate),
      icon: Percent,
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.label}
            className="rounded-xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/5"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-black/55 dark:text-white/55">
                {card.label}
              </p>

              <Icon
                className="size-4 text-black/45 dark:text-white/45"
                aria-hidden="true"
              />
            </div>

            <p className="mt-2 text-2xl font-semibold tracking-tight">
              {card.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}
