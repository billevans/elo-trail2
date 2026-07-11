import { LoaderCircle } from "lucide-react";

interface ComparisonLoadingStateProps {
  message?: string;
}

export function ComparisonLoadingState({
  message = "Loading comparison…",
}: ComparisonLoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-72 items-center justify-center rounded-2xl border border-dashed border-black/15 bg-black/[0.015] p-8 dark:border-white/15 dark:bg-white/[0.02]"
    >
      <div className="flex items-center gap-3 text-black/55 dark:text-white/55">
        <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />

        <span>{message}</span>
      </div>
    </div>
  );
}
