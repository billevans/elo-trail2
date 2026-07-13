import {
  Activity,
  ArrowDown,
  ArrowUp,
  BarChart3,
  CalendarDays,
  Crown,
  Flame,
  Gauge,
  Minus,
  Percent,
  ShieldCheck,
  ShieldX,
  TimerOff,
  Trophy,
} from "lucide-react";

import type { PlayerAnalytics, StreakValue } from "@/services/analytics";

interface PlayerAnalyticsCardsProps {
  analytics: PlayerAnalytics;
}

function formatNumber(value: number | null, digits = 0) {
  if (value === null) {
    return "—";
  }

  return value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function formatSigned(value: number | null, digits = 0) {
  if (value === null) {
    return "—";
  }

  const formatted = formatNumber(Math.abs(value), digits);

  if (value > 0) {
    return `+${formatted}`;
  }

  if (value < 0) {
    return `-${formatted}`;
  }

  return formatted;
}

function formatPercentage(value: number | null) {
  return value === null ? "—" : `${value.toFixed(1)}%`;
}

function formatStreak(streak: StreakValue) {
  if (streak.kind === "none" || streak.count === 0) {
    return "None";
  }

  return `${streak.count} ${
    streak.kind === "win"
      ? streak.count === 1
        ? "win"
        : "wins"
      : streak.count === 1
        ? "loss"
        : "losses"
  }`;
}

export function PlayerAnalyticsCards({ analytics }: PlayerAnalyticsCardsProps) {
  const cards = [
    {
      label: "Current ELO",
      value: formatNumber(analytics.rating.currentElo),
      icon: Gauge,
    },
    {
      label: "Peak ELO",
      value: formatNumber(analytics.rating.peak.rating),
      icon: Crown,
    },
    {
      label: "Lowest ELO",
      value: formatNumber(analytics.rating.lowest.rating),
      icon: BarChart3,
    },
    {
      label: "Average ELO",
      value: formatNumber(analytics.rating.averageElo),
      icon: Activity,
    },
    {
      label: "Career games",
      value: analytics.career.games.toLocaleString(),
      icon: CalendarDays,
    },
    {
      label: "Career wins",
      value: analytics.career.wins.toLocaleString(),
      icon: ShieldCheck,
    },
    {
      label: "Career losses",
      value: analytics.career.losses.toLocaleString(),
      icon: ShieldX,
    },
    {
      label: "Career win rate",
      value: formatPercentage(analytics.career.winRate),
      icon: Percent,
    },
    {
      label: "Current streak",
      value: formatStreak(analytics.streaks.current),
      icon:
        analytics.streaks.current.kind === "win"
          ? Flame
          : analytics.streaks.current.kind === "loss"
            ? ArrowDown
            : Minus,
    },
    {
      label: "Best win streak",
      value: `${analytics.streaks.longestWin.toLocaleString()} wins`,
      icon: Trophy,
    },
    {
      label: "Longest loss streak",
      value: `${analytics.streaks.longestLoss.toLocaleString()} losses`,
      icon: ArrowDown,
    },
    {
      label: "Longest break",
      value:
        analytics.activity.longestBreak.days > 0
          ? `${analytics.activity.longestBreak.days.toLocaleString()} days`
          : "—",
      icon: TimerOff,
    },
    {
      label: "Biggest gain",
      value: formatSigned(analytics.matches.biggestGain),
      icon: ArrowUp,
    },
    {
      label: "Biggest loss",
      value: formatSigned(analytics.matches.biggestLoss),
      icon: ArrowDown,
    },
    {
      label: "Average gain",
      value: formatSigned(analytics.matches.averageGain, 1),
      icon: ArrowUp,
    },
    {
      label: "Average loss",
      value: formatSigned(analytics.matches.averageLoss, 1),
      icon: ArrowDown,
    },
  ];

  return (
    <section aria-labelledby="player-analytics-heading" className="space-y-3">
      <div>
        <h3 id="player-analytics-heading" className="text-lg font-semibold">
          Player analytics
        </h3>

        <p className="text-sm text-black/55 dark:text-white/55">
          Career totals and insights from the selected ELO-history range.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <article
              key={card.label}
              className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-black/50 dark:text-white/50">
                  {card.label}
                </p>

                <Icon
                  className="size-4 text-black/40 dark:text-white/40"
                  aria-hidden="true"
                />
              </div>

              <p className="mt-2 truncate text-2xl font-semibold tabular-nums">
                {card.value}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
