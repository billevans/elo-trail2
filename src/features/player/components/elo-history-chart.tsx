"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { RotateCcw } from "lucide-react";
import {
  Area,
  AreaChart,
  Brush,
  CartesianGrid,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  calculateChartDomain,
  calculateEloChartSummary,
} from "@/features/player/lib";
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

interface ZoomRange {
  startIndex: number;
  endIndex: number;
}

function ChartTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0]?.payload;

  if (!point) {
    return null;
  }

  const ratingBefore = point.rating - point.ratingChange;

  return (
    <div className="min-w-52 rounded-xl border border-black/10 bg-white p-3 shadow-xl dark:border-white/10 dark:bg-neutral-950">
      <p className="text-xs font-medium tracking-wide text-black/45 uppercase dark:text-white/45">
        Matchmaking ELO
      </p>

      <p className="mt-1 text-2xl font-semibold tabular-nums">
        {point.rating.toLocaleString()}
      </p>

      <p className="mt-1 text-sm text-black/55 dark:text-white/55">
        {format(new Date(point.timestamp), "d MMM yyyy, h:mm a")}
      </p>

      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-black/10 pt-3 text-sm dark:border-white/10">
        <div>
          <p className="text-xs text-black/45 dark:text-white/45">Before</p>

          <p className="font-medium tabular-nums">
            {ratingBefore.toLocaleString()}
          </p>
        </div>

        <div>
          <p className="text-xs text-black/45 dark:text-white/45">Change</p>

          <p
            className={[
              "font-semibold tabular-nums",
              point.ratingChange >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-red-600 dark:text-red-400",
            ].join(" ")}
          >
            {point.ratingChange >= 0 ? "+" : ""}
            {point.ratingChange}
          </p>
        </div>
      </div>
    </div>
  );
}

export function EloHistoryChart({ points }: EloHistoryChartProps) {
  const sortedPoints = useMemo(
    () =>
      [...points].sort(
        (left, right) =>
          new Date(left.timestamp).getTime() -
          new Date(right.timestamp).getTime(),
      ),
    [points],
  );

  const [zoomRange, setZoomRange] = useState<ZoomRange | null>(null);

  const summary = useMemo(
    () => calculateEloChartSummary(sortedPoints),
    [sortedPoints],
  );

  const visiblePoints = useMemo(() => {
    if (!zoomRange) {
      return sortedPoints;
    }

    return sortedPoints.slice(zoomRange.startIndex, zoomRange.endIndex + 1);
  }, [sortedPoints, zoomRange]);

  const yDomain = useMemo(
    () => calculateChartDomain(visiblePoints),
    [visiblePoints],
  );

  if (sortedPoints.length === 0) {
    return (
      <div className="flex min-h-96 items-center justify-center text-sm text-black/50 dark:text-white/50">
        No rating history is available for this range.
      </div>
    );
  }

  const hasZoom =
    zoomRange !== null &&
    (zoomRange.startIndex > 0 || zoomRange.endIndex < sortedPoints.length - 1);

  return (
    <div className="space-y-3">
      <div className="flex min-h-8 items-center justify-between gap-3">
        <p className="text-xs text-black/45 dark:text-white/45">
          Drag the lower timeline handles to zoom.
        </p>

        {hasZoom && (
          <button
            type="button"
            onClick={() => setZoomRange(null)}
            className="inline-flex items-center gap-1.5 rounded-md border border-black/10 px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            Reset zoom
          </button>
        )}
      </div>

      <div
        className="h-[28rem] w-full"
        role="img"
        aria-label="Matchmaking ELO timeline with peak, lowest, average and starting rating markers"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={sortedPoints}
            margin={{
              top: 24,
              right: 24,
              bottom: 8,
              left: 0,
            }}
          >
            <defs>
              <linearGradient id="elo-history-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="currentColor" stopOpacity={0.24} />

                <stop
                  offset="95%"
                  stopColor="currentColor"
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              opacity={0.18}
            />

            <XAxis
              dataKey="timestamp"
              tickFormatter={(value: string) =>
                format(new Date(value), "d MMM")
              }
              minTickGap={32}
              tickLine={false}
              axisLine={false}
              fontSize={12}
            />

            <YAxis
              domain={yDomain}
              width={68}
              tickLine={false}
              axisLine={false}
              fontSize={12}
              tickFormatter={(value: number) => value.toLocaleString()}
            />

            <Tooltip content={<ChartTooltip />} />

            {summary.averageElo !== null && (
              <ReferenceLine
                y={summary.averageElo}
                stroke="currentColor"
                strokeDasharray="5 5"
                strokeOpacity={0.45}
                label={{
                  value: `Average ${Math.round(
                    summary.averageElo,
                  ).toLocaleString()}`,
                  position: "insideTopRight",
                  fontSize: 11,
                }}
              />
            )}

            {summary.startingElo !== null && (
              <ReferenceLine
                y={summary.startingElo}
                stroke="currentColor"
                strokeDasharray="2 6"
                strokeOpacity={0.3}
                label={{
                  value: `Start ${Math.round(
                    summary.startingElo,
                  ).toLocaleString()}`,
                  position: "insideBottomRight",
                  fontSize: 11,
                }}
              />
            )}

            {summary.peakPoint && (
              <ReferenceDot
                x={summary.peakPoint.timestamp}
                y={summary.peakPoint.rating}
                r={5}
                fill="#16a34a"
                stroke="#ffffff"
                strokeWidth={2}
                label={{
                  value: `Peak ${summary.peakPoint.rating.toLocaleString()}`,
                  position: "top",
                  fontSize: 11,
                }}
              />
            )}

            {summary.lowestPoint && (
              <ReferenceDot
                x={summary.lowestPoint.timestamp}
                y={summary.lowestPoint.rating}
                r={5}
                fill="#dc2626"
                stroke="#ffffff"
                strokeWidth={2}
                label={{
                  value: `Low ${summary.lowestPoint.rating.toLocaleString()}`,
                  position: "bottom",
                  fontSize: 11,
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey="rating"
              stroke="currentColor"
              strokeWidth={2.5}
              fill="url(#elo-history-fill)"
              dot={false}
              activeDot={{
                r: 5,
              }}
              isAnimationActive={false}
            />

            <Brush
              dataKey="timestamp"
              height={34}
              travellerWidth={10}
              tickFormatter={(value: string) =>
                format(new Date(value), "d MMM")
              }
              startIndex={zoomRange?.startIndex ?? 0}
              endIndex={zoomRange?.endIndex ?? sortedPoints.length - 1}
              onChange={(range) => {
                if (
                  typeof range.startIndex !== "number" ||
                  typeof range.endIndex !== "number"
                ) {
                  return;
                }

                const isFullRange =
                  range.startIndex === 0 &&
                  range.endIndex === sortedPoints.length - 1;

                setZoomRange(
                  isFullRange
                    ? null
                    : {
                        startIndex: range.startIndex,
                        endIndex: range.endIndex,
                      },
                );
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
