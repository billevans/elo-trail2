import { ArrowDown, ArrowUp, Minus } from "lucide-react";

import type { ComparisonAnalytics } from "../lib/comparison-analytics";

interface ComparisonMetricsTableProps {
  playerOneName: string;
  playerTwoName: string;
  playerOne: ComparisonAnalytics;
  playerTwo: ComparisonAnalytics;
}

type MetricValue = number | null;

interface MetricDefinition {
  label: string;

  getValue: (analytics: ComparisonAnalytics) => MetricValue;

  format: (value: MetricValue) => string;

  higherIsBetter?: boolean;

  lowerIsBetter?: boolean;
}

function formatInteger(value: MetricValue) {
  return value === null ? "—" : Math.round(value).toLocaleString();
}

function formatSignedInteger(value: MetricValue) {
  if (value === null) {
    return "—";
  }

  const rounded = Math.round(value);

  return rounded > 0
    ? `+${rounded.toLocaleString()}`
    : rounded.toLocaleString();
}

function formatDecimal(value: MetricValue) {
  return value === null ? "—" : value.toFixed(1);
}

function formatPercentage(value: MetricValue) {
  return value === null ? "—" : `${value.toFixed(1)}%`;
}

const METRICS: MetricDefinition[] = [
  {
    label: "Starting ELO",
    getValue: (analytics) => analytics.startingElo,
    format: formatInteger,
  },
  {
    label: "Current ELO",
    getValue: (analytics) => analytics.currentElo,
    format: formatInteger,
    higherIsBetter: true,
  },
  {
    label: "ELO change",
    getValue: (analytics) => analytics.eloChange,
    format: formatSignedInteger,
    higherIsBetter: true,
  },
  {
    label: "Peak ELO",
    getValue: (analytics) => analytics.peakElo,
    format: formatInteger,
    higherIsBetter: true,
  },
  {
    label: "Lowest ELO",
    getValue: (analytics) => analytics.lowestElo,
    format: formatInteger,
    higherIsBetter: true,
  },
  {
    label: "Games played",
    getValue: (analytics) => analytics.games,
    format: formatInteger,
  },
  {
    label: "Wins",
    getValue: (analytics) => analytics.wins,
    format: formatInteger,
    higherIsBetter: true,
  },
  {
    label: "Losses",
    getValue: (analytics) => analytics.losses,
    format: formatInteger,
    lowerIsBetter: true,
  },
  {
    label: "Win rate",
    getValue: (analytics) => analytics.winRate,
    format: formatPercentage,
    higherIsBetter: true,
  },
  {
    label: "Average ELO movement",
    getValue: (analytics) => analytics.averageEloMovement,
    format: formatDecimal,
  },
  {
    label: "Largest gain",
    getValue: (analytics) => analytics.largestGain,
    format: formatSignedInteger,
    higherIsBetter: true,
  },
  {
    label: "Largest loss",
    getValue: (analytics) => analytics.largestLoss,
    format: formatSignedInteger,
    higherIsBetter: true,
  },
];

type Leader = "one" | "two" | "tie" | null;

function determineLeader(
  valueOne: MetricValue,
  valueTwo: MetricValue,
  metric: MetricDefinition,
): Leader {
  if (valueOne === null || valueTwo === null) {
    return null;
  }

  if (!metric.higherIsBetter && !metric.lowerIsBetter) {
    return null;
  }

  if (valueOne === valueTwo) {
    return "tie";
  }

  if (metric.lowerIsBetter) {
    return valueOne < valueTwo ? "one" : "two";
  }

  return valueOne > valueTwo ? "one" : "two";
}

function MetricValueDisplay({
  value,
  formattedValue,
  isLeader,
}: {
  value: MetricValue;
  formattedValue: string;
  isLeader: boolean;
}) {
  const isPositive = value !== null && value > 0;

  const isNegative = value !== null && value < 0;

  return (
    <div className="flex items-center justify-end gap-1.5">
      {isLeader && (
        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          Leads
        </span>
      )}

      {isPositive && (
        <ArrowUp
          className="size-3.5 text-emerald-600 dark:text-emerald-400"
          aria-hidden="true"
        />
      )}

      {isNegative && (
        <ArrowDown
          className="size-3.5 text-red-600 dark:text-red-400"
          aria-hidden="true"
        />
      )}

      {value === 0 && (
        <Minus
          className="size-3.5 text-black/35 dark:text-white/35"
          aria-hidden="true"
        />
      )}

      <span className="font-medium tabular-nums">{formattedValue}</span>
    </div>
  );
}

export function ComparisonMetricsTable({
  playerOneName,
  playerTwoName,
  playerOne,
  playerTwo,
}: ComparisonMetricsTableProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-black/10 bg-white dark:border-white/10 dark:bg-white/[0.03]">
      <header className="border-b border-black/10 p-4 dark:border-white/10">
        <h3 className="text-lg font-semibold">Head-to-head analytics</h3>

        <p className="mt-1 text-sm text-black/55 dark:text-white/55">
          Statistics for the selected comparison period.
        </p>
      </header>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[42rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-black/[0.025] dark:border-white/10 dark:bg-white/[0.025]">
              <th className="px-4 py-3 text-left font-medium text-black/55 dark:text-white/55">
                Metric
              </th>

              <th className="px-4 py-3 text-right font-semibold">
                {playerOneName}
              </th>

              <th className="px-4 py-3 text-right font-semibold">
                {playerTwoName}
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-black/10 dark:divide-white/10">
            {METRICS.map((metric) => {
              const valueOne = metric.getValue(playerOne);

              const valueTwo = metric.getValue(playerTwo);

              const leader = determineLeader(valueOne, valueTwo, metric);

              return (
                <tr
                  key={metric.label}
                  className="transition hover:bg-black/[0.02] dark:hover:bg-white/[0.025]"
                >
                  <th
                    scope="row"
                    className="px-4 py-3 text-left font-medium text-black/60 dark:text-white/60"
                  >
                    {metric.label}
                  </th>

                  <td className="px-4 py-3 text-right">
                    <MetricValueDisplay
                      value={valueOne}
                      formattedValue={metric.format(valueOne)}
                      isLeader={leader === "one"}
                    />
                  </td>

                  <td className="px-4 py-3 text-right">
                    <MetricValueDisplay
                      value={valueTwo}
                      formattedValue={metric.format(valueTwo)}
                      isLeader={leader === "two"}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
