import { Crown, ShieldAlert, Swords, Trophy } from "lucide-react";

import type { CivilisationAnalytics } from "@/services/analytics";

import { formatCivilisationName } from "../lib";

interface CivilisationAnalyticsPanelProps {
  analytics: CivilisationAnalytics;
}

function formatPercentage(value: number | null): string {
  return value === null ? "—" : `${value.toFixed(1)}%`;
}

function formatSigned(value: number): string {
  if (value > 0) {
    return `+${value.toLocaleString()}`;
  }

  return value.toLocaleString();
}

interface HighlightCardProps {
  label: string;
  civilisation: string | null;
  detail: string;
  icon: typeof Crown;
}

function HighlightCard({
  label,
  civilisation,
  detail,
  icon: Icon,
}: HighlightCardProps) {
  return (
    <article className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-black/50 dark:text-white/50">{label}</p>

        <Icon
          className="size-4 text-black/40 dark:text-white/40"
          aria-hidden="true"
        />
      </div>

      <p className="mt-2 truncate text-lg font-semibold">
        {civilisation
          ? formatCivilisationName(civilisation)
          : "Not enough data"}
      </p>

      <p className="mt-1 text-xs text-black/50 dark:text-white/50">{detail}</p>
    </article>
  );
}

export function CivilisationAnalyticsPanel({
  analytics,
}: CivilisationAnalyticsPanelProps) {
  if (analytics.civilisations.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-black/15 p-8 text-center dark:border-white/15">
        <h3 className="font-semibold">Civilisation analytics unavailable</h3>

        <p className="mt-1 text-sm text-black/55 dark:text-white/55">
          The selected history range does not contain civilisation information.
        </p>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="civilisation-analytics-heading"
      className="space-y-4"
    >
      <div>
        <h3
          id="civilisation-analytics-heading"
          className="text-lg font-semibold"
        >
          Civilisation analytics
        </h3>

        <p className="text-sm text-black/55 dark:text-white/55">
          Performance by civilisation for games in the selected ELO-history
          range.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <HighlightCard
          label="Favourite civilisation"
          civilisation={analytics.favourite.civilisation}
          detail={
            analytics.favourite.civilisation
              ? `${analytics.favourite.games.toLocaleString()} games`
              : "No civilisation games"
          }
          icon={Crown}
        />

        <HighlightCard
          label="Best win rate"
          civilisation={analytics.strongest.civilisation}
          detail={
            analytics.strongest.civilisation
              ? `${formatPercentage(
                  analytics.strongest.winRate,
                )} over ${analytics.strongest.games.toLocaleString()} games`
              : "Minimum 3 games required"
          }
          icon={Trophy}
        />

        <HighlightCard
          label="Lowest win rate"
          civilisation={analytics.weakest.civilisation}
          detail={
            analytics.weakest.civilisation
              ? `${formatPercentage(
                  analytics.weakest.winRate,
                )} over ${analytics.weakest.games.toLocaleString()} games`
              : "Minimum 3 games required"
          }
          icon={ShieldAlert}
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/10">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-black/[0.03] text-xs tracking-wide text-black/50 uppercase dark:bg-white/[0.05] dark:text-white/50">
            <tr>
              <th className="px-4 py-3 font-medium">Civilisation</th>

              <th className="px-4 py-3 text-right font-medium">Games</th>

              <th className="px-4 py-3 text-right font-medium">Wins</th>

              <th className="px-4 py-3 text-right font-medium">Losses</th>

              <th className="px-4 py-3 text-right font-medium">Win rate</th>

              <th className="px-4 py-3 text-right font-medium">Net ELO</th>

              <th className="px-4 py-3 text-right font-medium">Avg change</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-black/10 dark:divide-white/10">
            {analytics.civilisations.map((entry) => (
              <tr
                key={entry.civilisation}
                className="bg-white dark:bg-white/[0.025]"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 font-medium">
                    <Swords
                      className="size-4 text-black/35 dark:text-white/35"
                      aria-hidden="true"
                    />

                    {formatCivilisationName(entry.civilisation)}
                  </div>
                </td>

                <td className="px-4 py-3 text-right tabular-nums">
                  {entry.games.toLocaleString()}
                </td>

                <td className="px-4 py-3 text-right tabular-nums">
                  {entry.wins.toLocaleString()}
                </td>

                <td className="px-4 py-3 text-right tabular-nums">
                  {entry.losses.toLocaleString()}
                </td>

                <td className="px-4 py-3 text-right tabular-nums">
                  {formatPercentage(entry.winRate)}
                </td>

                <td
                  className={[
                    "px-4 py-3 text-right font-medium tabular-nums",
                    entry.netEloChange > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : entry.netEloChange < 0
                        ? "text-red-600 dark:text-red-400"
                        : "",
                  ].join(" ")}
                >
                  {formatSigned(entry.netEloChange)}
                </td>

                <td className="px-4 py-3 text-right tabular-nums">
                  {entry.averageEloChange === null
                    ? "—"
                    : formatSigned(Number(entry.averageEloChange.toFixed(1)))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-black/45 dark:text-white/45">
        Best and lowest win-rate highlights require at least three games with a
        civilisation in the selected range.
      </p>
    </section>
  );
}
