import { Crosshair, Repeat2, ShieldCheck, Swords, Users } from "lucide-react";

import type {
  OpponentAnalytics,
  OpponentMatchHighlight,
  OpponentSummaryHighlight,
} from "@/services/analytics";

interface OpponentAnalyticsPanelProps {
  analytics: OpponentAnalytics;
}

function formatNumber(value: number | null): string {
  return value === null ? "—" : Math.round(value).toLocaleString();
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

interface MatchHighlightCardProps {
  label: string;
  highlight: OpponentMatchHighlight;
  emptyText: string;
  icon: typeof Crosshair;
}

function MatchHighlightCard({
  label,
  highlight,
  emptyText,
  icon: Icon,
}: MatchHighlightCardProps) {
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
        {highlight.name ?? emptyText}
      </p>

      <p className="mt-1 text-xs text-black/50 dark:text-white/50">
        {highlight.opponentElo !== null
          ? `${highlight.opponentElo.toLocaleString()} opponent ELO`
          : "Opponent ELO unavailable"}
      </p>
    </article>
  );
}

interface RivalryCardProps {
  highlight: OpponentSummaryHighlight;
}

function RivalryCard({ highlight }: RivalryCardProps) {
  return (
    <article className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-black/50 dark:text-white/50">
          Most frequent opponent
        </p>

        <Repeat2
          className="size-4 text-black/40 dark:text-white/40"
          aria-hidden="true"
        />
      </div>

      <p className="mt-2 truncate text-lg font-semibold">
        {highlight.name ?? "No opponent data"}
      </p>

      <p className="mt-1 text-xs text-black/50 dark:text-white/50">
        {highlight.name
          ? `${highlight.games.toLocaleString()} games · ${highlight.wins.toLocaleString()}–${highlight.losses.toLocaleString()} · ${formatPercentage(
              highlight.winRate,
            )}`
          : "No repeat opponents"}
      </p>
    </article>
  );
}

export function OpponentAnalyticsPanel({
  analytics,
}: OpponentAnalyticsPanelProps) {
  if (analytics.opponents.length === 0) {
    return (
      <section className="rounded-xl border border-dashed border-black/15 p-8 text-center dark:border-white/15">
        <h3 className="font-semibold">Opponent analytics unavailable</h3>

        <p className="mt-1 text-sm text-black/55 dark:text-white/55">
          The selected history range does not contain opponent information.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="opponent-analytics-heading" className="space-y-4">
      <div>
        <h3 id="opponent-analytics-heading" className="text-lg font-semibold">
          Opponent analytics
        </h3>

        <p className="text-sm text-black/55 dark:text-white/55">
          Opponent strength and repeat-match performance for the selected
          ELO-history range.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MatchHighlightCard
          label="Strongest opponent defeated"
          highlight={analytics.strongestDefeated}
          emptyText="No rated victory"
          icon={ShieldCheck}
        />

        <MatchHighlightCard
          label="Highest-rated opponent faced"
          highlight={analytics.highestFaced}
          emptyText="No rated opponent"
          icon={Crosshair}
        />

        <RivalryCard highlight={analytics.mostFrequent} />

        <article className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-white/[0.04]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-black/50 dark:text-white/50">
              Average opponent ELO
            </p>

            <Users
              className="size-4 text-black/40 dark:text-white/40"
              aria-hidden="true"
            />
          </div>

          <p className="mt-2 text-lg font-semibold tabular-nums">
            {formatNumber(analytics.averageOpponentElo)}
          </p>

          <p className="mt-1 text-xs text-black/50 dark:text-white/50">
            {analytics.uniqueOpponents.toLocaleString()} unique ·{" "}
            {analytics.repeatOpponents.toLocaleString()} repeat opponents
          </p>
        </article>
      </div>

      <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-white/10">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-black/[0.03] text-xs tracking-wide text-black/50 uppercase dark:bg-white/[0.05] dark:text-white/50">
            <tr>
              <th className="px-4 py-3 font-medium">Opponent</th>

              <th className="px-4 py-3 text-right font-medium">Games</th>

              <th className="px-4 py-3 text-right font-medium">Record</th>

              <th className="px-4 py-3 text-right font-medium">Win rate</th>

              <th className="px-4 py-3 text-right font-medium">
                Avg opponent ELO
              </th>

              <th className="px-4 py-3 text-right font-medium">Highest ELO</th>

              <th className="px-4 py-3 text-right font-medium">Net ELO</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-black/10 dark:divide-white/10">
            {analytics.opponents.map((opponent) => (
              <tr
                key={opponent.opponentKey}
                className="bg-white dark:bg-white/[0.025]"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 font-medium">
                    <Swords
                      className="size-4 text-black/35 dark:text-white/35"
                      aria-hidden="true"
                    />

                    <span className="max-w-56 truncate">{opponent.name}</span>
                  </div>
                </td>

                <td className="px-4 py-3 text-right tabular-nums">
                  {opponent.games.toLocaleString()}
                </td>

                <td className="px-4 py-3 text-right tabular-nums">
                  {opponent.wins.toLocaleString()}–
                  {opponent.losses.toLocaleString()}
                </td>

                <td className="px-4 py-3 text-right tabular-nums">
                  {formatPercentage(opponent.winRate)}
                </td>

                <td className="px-4 py-3 text-right tabular-nums">
                  {formatNumber(opponent.averageOpponentElo)}
                </td>

                <td className="px-4 py-3 text-right tabular-nums">
                  {formatNumber(opponent.highestOpponentElo)}
                </td>

                <td
                  className={[
                    "px-4 py-3 text-right font-medium tabular-nums",
                    opponent.netEloChange > 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : opponent.netEloChange < 0
                        ? "text-red-600 dark:text-red-400"
                        : "",
                  ].join(" ")}
                >
                  {formatSigned(opponent.netEloChange)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
