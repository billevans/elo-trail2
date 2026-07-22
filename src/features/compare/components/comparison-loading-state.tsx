import { LoaderCircle } from "lucide-react";

interface ComparisonLoadingStateProps {
  message?: string;
}

export function ComparisonLoadingState({
  message = "Loading comparison…",
}: ComparisonLoadingStateProps) {
  return (
    <section
      aria-busy="true"
      aria-labelledby="comparison-loading-heading"
      className="flex min-h-72 items-center justify-center rounded-2xl border border-black/10 bg-black/[0.015] p-6 text-center dark:border-white/10 dark:bg-white/[0.02]"
    >
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center gap-3"
      >
        <LoaderCircle
          className="size-6 animate-spin text-black/55 dark:text-white/55"
          aria-hidden="true"
        />

        <div>
          <h2 id="comparison-loading-heading" className="font-semibold">
            Preparing comparison
          </h2>

          <p className="mt-1 text-sm text-black/55 dark:text-white/55">
            {message}
          </p>
        </div>
      </div>
    </section>
  );
}
