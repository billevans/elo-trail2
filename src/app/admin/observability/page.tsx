import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminSessionRefresh } from "./admin-session-refresh";

import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Database,
  Gauge,
  Search,
  ServerCog,
} from "lucide-react";

import {
  getObservabilityDashboardComparison,
  normaliseObservabilityWindow,
  type MetricTrend,
  type ObservabilityDashboard,
  type ObservabilityWindow,
} from "@/services/observability/dashboard";

import {
  ADMIN_SESSION_COOKIE,
  verifyAdminSessionToken,
} from "@/services/observability/dashboard/admin-session";

import styles from "./observability-dashboard.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Operations | ELO Trail",
  robots: {
    index: false,
    follow: false,
  },
};

interface ObservabilityPageProps {
  searchParams: Promise<{
    window?: string | string[];
  }>;
}

type HealthTone = "green" | "amber" | "red";

interface KpiCardProps {
  label: string;
  value: string;
  detail: string;
  tone: HealthTone;
  trend: MetricTrend;
  lowerIsBetter?: boolean;
  icon: React.ReactNode;
}

const WINDOW_LABELS: Record<ObservabilityWindow, string> = {
  "24h": "24h",
  "7d": "7d",
  "30d": "30d",
};

function percentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function number(value: number): string {
  return new Intl.NumberFormat("en-NZ").format(value);
}

function duration(value: number): string {
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}s`;
  }

  return `${Math.round(value)}ms`;
}

function dateTime(value: string): string {
  return new Intl.DateTimeFormat("en-NZ", {
    dateStyle: "medium",
    timeStyle: "medium",
    timeZone: "Pacific/Auckland",
  }).format(new Date(value));
}

function getStatusClass(tone: HealthTone): string {
  if (tone === "green") {
    return styles.statusGreen;
  }

  if (tone === "amber") {
    return styles.statusAmber;
  }

  return styles.statusRed;
}

function getStatusLabel(tone: HealthTone): string {
  if (tone === "green") {
    return "Healthy";
  }

  if (tone === "amber") {
    return "Watch";
  }

  return "Attention";
}

function getErrorRateTone(errorRate: number): HealthTone {
  if (errorRate < 0.02) {
    return "green";
  }

  if (errorRate < 0.05) {
    return "amber";
  }

  return "red";
}

function getDurationTone(averageDurationMs: number): HealthTone {
  if (averageDurationMs < 750) {
    return "green";
  }

  if (averageDurationMs < 2_000) {
    return "amber";
  }

  return "red";
}

function getCacheTone(cacheHitRate: number): HealthTone {
  if (cacheHitRate >= 0.75) {
    return "green";
  }

  if (cacheHitRate >= 0.5) {
    return "amber";
  }

  return "red";
}

function getVolumeTone(errorEvents: number): HealthTone {
  if (errorEvents === 0) {
    return "green";
  }

  if (errorEvents <= 3) {
    return "amber";
  }

  return "red";
}

function TrendIndicator({
  trend,
  lowerIsBetter = false,
}: {
  trend: MetricTrend;
  lowerIsBetter?: boolean;
}) {
  if (trend.direction === "unavailable" || trend.changePercent === null) {
    return (
      <div className={`${styles.trend} ${styles.trendNeutral}`}>
        <ArrowRight size={14} aria-hidden="true" />
        Previous period unavailable
      </div>
    );
  }

  const improvement =
    trend.direction === "flat" ||
    (lowerIsBetter ? trend.direction === "down" : trend.direction === "up");

  const trendClass =
    trend.direction === "flat"
      ? styles.trendNeutral
      : improvement
        ? styles.trendGood
        : styles.trendBad;

  const Icon =
    trend.direction === "up"
      ? ArrowUpRight
      : trend.direction === "down"
        ? ArrowDownRight
        : ArrowRight;

  return (
    <div className={`${styles.trend} ${trendClass}`}>
      <Icon size={14} aria-hidden="true" />
      {Math.abs(trend.changePercent).toFixed(1)}% vs previous period
    </div>
  );
}

function KpiCard({
  label,
  value,
  detail,
  tone,
  trend,
  lowerIsBetter,
  icon,
}: KpiCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.cardLabel}>{label}</div>

        <span className={`${styles.status} ${getStatusClass(tone)}`}>
          {getStatusLabel(tone)}
        </span>
      </div>

      <div className={styles.cardValue}>{value}</div>
      <div className={styles.cardDetail}>
        {icon} {detail}
      </div>

      <TrendIndicator trend={trend} lowerIsBetter={lowerIsBetter} />
    </article>
  );
}

function HistoryPanel({ dashboard }: { dashboard: ObservabilityDashboard }) {
  const metrics = [
    ["History requests", dashboard.history.requests],
    ["Fresh cache hits", dashboard.history.freshCacheHits],
    ["Incremental refreshes", dashboard.history.incrementalRefreshes],
    ["Full refreshes", dashboard.history.fullRefreshes],
    ["Cache misses", dashboard.history.cacheMisses],
    ["Stale fallbacks", dashboard.history.staleFallbacks],
    ["Refreshes in progress", dashboard.history.refreshesInProgress],
    ["History errors", dashboard.history.errors],
  ] as const;

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>History cache operations</h2>

        <p className={styles.panelDescription}>
          Persistent-cache outcomes and refresh behaviour.
        </p>
      </div>

      <div className={styles.metricList}>
        {metrics.map(([label, value]) => (
          <div className={styles.metricItem} key={label}>
            <div className={styles.metricLabel}>{label}</div>
            <div className={styles.metricValue}>{number(value)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ActivityPanel({ dashboard }: { dashboard: ObservabilityDashboard }) {
  const metrics = [
    ["Successful searches", dashboard.search.successfulSearches],
    ["Failed searches", dashboard.search.failedSearches],
    ["Search results returned", dashboard.search.totalResultsReturned],
    ["Leaderboard reads", dashboard.leaderboard.reads],
    ["Leaderboard refreshes", dashboard.leaderboard.refreshes],
    ["Cleanup runs", dashboard.cleanup.successfulRuns],
    ["Cleanup failures", dashboard.cleanup.failedRuns],
    ["Caches deleted", dashboard.cleanup.deletedCaches],
  ] as const;

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>Supporting operations</h2>

        <p className={styles.panelDescription}>
          Search, leaderboard and retention activity.
        </p>
      </div>

      <div className={styles.metricList}>
        {metrics.map(([label, value]) => (
          <div className={styles.metricItem} key={label}>
            <div className={styles.metricLabel}>{label}</div>
            <div className={styles.metricValue}>{number(value)}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default async function ObservabilityPage({
  searchParams,
}: ObservabilityPageProps) {
  const cookieStore = await cookies();

  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = verifyAdminSessionToken(token);

  if (!session) {
    redirect("/admin/login?next=%2Fadmin%2Fobservability");
  }

  const resolvedSearchParams = await searchParams;

  const requestedWindow = Array.isArray(resolvedSearchParams.window)
    ? resolvedSearchParams.window[0]
    : resolvedSearchParams.window;

  const window = normaliseObservabilityWindow(requestedWindow);

  const { current, trends } = await getObservabilityDashboardComparison({
    window,
  });

  return (
    <>
      <AdminSessionRefresh />

      <main className={styles.page}>
        <div className={styles.shell}>
          <header className={styles.header}>
            <div>
              <div className={styles.eyebrow}>Private operations console</div>

              <h1 className={styles.title}>ELO Trail observability</h1>

              <p className={styles.subtitle}>
                Operational health, cache efficiency and bounded AoE4World
                usage. Search text, IP addresses and credentials are never
                displayed.
              </p>
            </div>
            <form action="/api/admin/logout" method="post">
              <button type="submit" className={styles.logoutButton}>
                Sign out
              </button>
            </form>
            <div className={styles.timestamp}>
              Generated
              <br />
              {dateTime(current.generatedAt)}
              <br />
              Window begins
              <br />
              {dateTime(current.windowStartedAt)}
            </div>
          </header>

          <nav
            className={styles.windowNavigation}
            aria-label="Reporting window"
          >
            {Object.entries(WINDOW_LABELS).map(([windowValue, label]) => {
              const active = windowValue === window;

              return (
                <Link
                  key={windowValue}
                  href={`/admin/observability?window=${windowValue}`}
                  className={`${styles.windowLink} ${
                    active ? styles.windowLinkActive : ""
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <section
            className={styles.kpiGrid}
            aria-label="Operational health summary"
          >
            <KpiCard
              label="Operational events"
              value={number(current.overview.totalEvents)}
              detail="Recorded events in this window"
              tone={getVolumeTone(current.overview.errorEvents)}
              trend={trends.totalEvents}
              icon={<Activity size={13} aria-hidden="true" />}
            />

            <KpiCard
              label="Error rate"
              value={percentage(current.overview.errorRate)}
              detail={`${number(current.overview.errorEvents)} error events`}
              tone={getErrorRateTone(current.overview.errorRate)}
              trend={trends.errorRate}
              lowerIsBetter
              icon={<AlertTriangle size={13} aria-hidden="true" />}
            />

            <KpiCard
              label="Average duration"
              value={duration(current.overview.averageDurationMs)}
              detail={`Maximum ${duration(current.overview.maximumDurationMs)}`}
              tone={getDurationTone(current.overview.averageDurationMs)}
              trend={trends.averageDurationMs}
              lowerIsBetter
              icon={<Clock3 size={13} aria-hidden="true" />}
            />

            <KpiCard
              label="Fresh cache rate"
              value={percentage(current.history.cacheHitRate)}
              detail={`${number(
                current.history.freshCacheHits,
              )} fresh cache outcomes`}
              tone={getCacheTone(current.history.cacheHitRate)}
              trend={trends.cacheHitRate}
              icon={<CheckCircle2 size={13} aria-hidden="true" />}
            />

            <KpiCard
              label="Upstream games"
              value={number(current.apiEfficiency.upstreamGames)}
              detail={`${number(
                current.apiEfficiency.returnedGames,
              )} games served`}
              tone="green"
              trend={trends.upstreamGames}
              lowerIsBetter
              icon={<Database size={13} aria-hidden="true" />}
            />
          </section>

          <div className={styles.dashboardGrid}>
            <HistoryPanel dashboard={current} />
            <ActivityPanel dashboard={current} />
          </div>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Route performance</h2>

              <p className={styles.panelDescription}>
                Volume, failure rate and response duration grouped by route.
              </p>
            </div>

            {current.routes.length === 0 ? (
              <div className={styles.emptyState}>
                No route activity was recorded during this period.
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Route</th>
                      <th>Events</th>
                      <th>Errors</th>
                      <th>Error rate</th>
                      <th>Average</th>
                      <th>Maximum</th>
                    </tr>
                  </thead>

                  <tbody>
                    {current.routes.map((route) => (
                      <tr key={route.route}>
                        <td className={styles.routeName}>{route.route}</td>
                        <td>{number(route.requests)}</td>
                        <td>{number(route.errors)}</td>
                        <td>{percentage(route.errorRate)}</td>
                        <td>{duration(route.averageDurationMs)}</td>
                        <td>{duration(route.maximumDurationMs)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className={`${styles.panel} ${styles.errorsPanel}`}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Recent operational errors</h2>

              <p className={styles.panelDescription}>
                The ten latest bounded errors in the selected reporting window.
              </p>
            </div>

            {current.recentErrors.length === 0 ? (
              <div className={styles.emptyState}>
                No operational errors were recorded.
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Event</th>
                      <th>Route</th>
                      <th>Status</th>
                      <th>Error code</th>
                      <th>Duration</th>
                    </tr>
                  </thead>

                  <tbody>
                    {current.recentErrors.map((error) => (
                      <tr
                        key={`${error.createdAt}-${error.eventName}-${error.route}`}
                      >
                        <td>{dateTime(error.createdAt)}</td>
                        <td>{error.eventName}</td>
                        <td className={styles.routeName}>
                          {error.route ?? "—"}
                        </td>
                        <td>{error.statusCode ?? "—"}</td>
                        <td className={styles.errorCode}>
                          {error.errorCode ?? "—"}
                        </td>
                        <td>
                          {error.durationMs === null
                            ? "—"
                            : duration(error.durationMs)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <footer className={styles.footer}>
            <Gauge size={13} aria-hidden="true" /> Server-rendered operational
            snapshot · no client polling
            {" · "}
            <Search size={13} aria-hidden="true" /> Search text is not retained
            {" · "}
            <ServerCog size={13} aria-hidden="true" /> Private access only
          </footer>
        </div>
      </main>
    </>
  );
}
