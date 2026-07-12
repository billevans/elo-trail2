"use client";

import { format } from "date-fns";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { HomepageLeaderboardPlayer } from "../types/homepage-leaderboard";

interface HomepageLeaderboardChartProps {
  players: HomepageLeaderboardPlayer[];
}

interface ChartRow {
  timestamp: number;

  [seriesKey: string]: number | null;
}

const SERIES_COLOURS = [
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#9333ea",
  "#ea580c",
  "#0891b2",
  "#db2777",
  "#65a30d",
] as const;

function getSeriesKey(profileId: number) {
  return `player_${profileId}`;
}

function buildChartData(players: HomepageLeaderboardPlayer[]): ChartRow[] {
  const rows = new Map<number, ChartRow>();

  for (const player of players) {
    const seriesKey = getSeriesKey(player.profileId);

    for (const point of player.points) {
      const timestamp = new Date(point.timestamp).getTime();

      if (!Number.isFinite(timestamp)) {
        continue;
      }

      const existing = rows.get(timestamp) ?? {
        timestamp,
      };

      existing[seriesKey] = point.rating;

      rows.set(timestamp, existing);
    }
  }

  return [...rows.values()].sort(
    (left, right) => left.timestamp - right.timestamp,
  );
}

export function HomepageLeaderboardChart({
  players,
}: HomepageLeaderboardChartProps) {
  const chartData = buildChartData(players);

  const ratings = players.flatMap((player) =>
    player.points.map((point) => point.rating),
  );

  if (chartData.length === 0 || ratings.length === 0) {
    return (
      <div className="flex min-h-96 items-center justify-center rounded-2xl border border-dashed border-black/15 p-8 text-center dark:border-white/15">
        <div>
          <p className="font-medium">Leaderboard history unavailable</p>

          <p className="mt-1 text-sm text-black/55 dark:text-white/55">
            The daily snapshot does not contain enough ELO history to draw the
            chart.
          </p>
        </div>
      </div>
    );
  }

  const minimumRating = Math.min(...ratings);

  const maximumRating = Math.max(...ratings);

  const ratingRange = maximumRating - minimumRating;

  const padding = Math.max(30, Math.round(ratingRange * 0.08));

  return (
    <div
      className="h-[32rem] w-full sm:h-[38rem]"
      role="img"
      aria-label="Ninety-day matchmaking ELO histories for the top eight players"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{
            top: 16,
            right: 16,
            bottom: 12,
            left: 0,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            opacity={0.18}
          />

          <XAxis
            dataKey="timestamp"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(value: number) => format(new Date(value), "d MMM")}
            minTickGap={38}
            tickLine={false}
            axisLine={false}
            fontSize={11}
          />

          <YAxis
            domain={[minimumRating - padding, maximumRating + padding]}
            width={64}
            tickLine={false}
            axisLine={false}
            fontSize={11}
            tickFormatter={(value: number) => value.toLocaleString()}
          />

          <Tooltip
            labelFormatter={(value) =>
              format(new Date(Number(value)), "d MMM yyyy, h:mm a")
            }
            formatter={(value, name) => [
              `${Number(value).toLocaleString()} ELO`,
              String(name),
            ]}
          />

          <Legend
            verticalAlign="bottom"
            wrapperStyle={{
              paddingTop: 18,
            }}
          />

          {players.map((player, index) => (
            <Line
              key={player.profileId}
              type="monotone"
              dataKey={getSeriesKey(player.profileId)}
              name={`#${player.rank} ${player.name}`}
              stroke={SERIES_COLOURS[index % SERIES_COLOURS.length]}
              strokeWidth={2.25}
              dot={false}
              activeDot={{
                r: 5,
              }}
              connectNulls
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
