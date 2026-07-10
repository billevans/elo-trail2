"use client";

import { format } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { EloPoint } from "@/types/history";

interface EloHistoryChartProps {
  points: EloPoint[];
}

interface TooltipPayloadItem {
  value?: number;
  payload?: EloPoint;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload;

  if (!point) {
    return null;
  }

  return (
    <div className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm shadow-lg dark:border-white/10 dark:bg-neutral-900">
      <p className="font-medium">{point.rating.toLocaleString()} ELO</p>

      <p className="text-black/55 dark:text-white/55">
        {format(new Date(point.timestamp), "d MMM yyyy, h:mm a")}
      </p>

      <p
        className={
          point.ratingChange >= 0
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-red-600 dark:text-red-400"
        }
      >
        {point.ratingChange >= 0 ? "+" : ""}
        {point.ratingChange}
      </p>
    </div>
  );
}

export function EloHistoryChart({ points }: EloHistoryChartProps) {
  if (points.length === 0) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-xl border border-dashed border-black/15 dark:border-white/15">
        <p className="text-sm text-black/55 dark:text-white/55">
          No rating history is available for this range.
        </p>
      </div>
    );
  }

  const ratings = points.map((point) => point.rating);

  const minimumRating = Math.min(...ratings);
  const maximumRating = Math.max(...ratings);

  const padding = Math.max(
    25,
    Math.round((maximumRating - minimumRating) * 0.15),
  );

  const averageRating = Math.round(
    ratings.reduce((total, rating) => total + rating, 0) / ratings.length,
  );

  return (
    <div className="h-96 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={points}
          margin={{
            top: 16,
            right: 16,
            bottom: 8,
            left: 0,
          }}
        >
          <defs>
            <linearGradient id="eloHistoryFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="currentColor" stopOpacity={0.3} />

              <stop offset="95%" stopColor="currentColor" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            opacity={0.18}
          />

          <XAxis
            dataKey="timestamp"
            tickFormatter={(value: string) => format(new Date(value), "d MMM")}
            minTickGap={32}
            tickLine={false}
            axisLine={false}
            fontSize={12}
          />

          <YAxis
            domain={[minimumRating - padding, maximumRating + padding]}
            width={54}
            tickLine={false}
            axisLine={false}
            fontSize={12}
            tickFormatter={(value: number) => value.toLocaleString()}
          />

          <Tooltip content={<ChartTooltip />} />

          <ReferenceLine
            y={averageRating}
            stroke="currentColor"
            strokeDasharray="4 4"
            opacity={0.3}
          />

          <Area
            type="monotone"
            dataKey="rating"
            stroke="currentColor"
            strokeWidth={2}
            fill="url(#eloHistoryFill)"
            activeDot={{
              r: 5,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
