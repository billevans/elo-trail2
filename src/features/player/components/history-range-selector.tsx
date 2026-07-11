export type HistoryRange = "30d" | "90d" | "180d";

interface HistoryRangeSelectorProps {
  value: HistoryRange;
  onChange: (range: HistoryRange) => void;
}

const OPTIONS: Array<{
  value: HistoryRange;
  label: string;
}> = [
  {
    value: "30d",
    label: "30 days",
  },
  {
    value: "90d",
    label: "90 days",
  },
  {
    value: "180d",
    label: "180 days",
  },
];

export function HistoryRangeSelector({
  value,
  onChange,
}: HistoryRangeSelectorProps) {
  return (
    <div
      className="inline-flex rounded-lg border border-black/10 bg-black/5 p-1 dark:border-white/10 dark:bg-white/5"
      aria-label="ELO history date range"
    >
      {OPTIONS.map((option) => {
        const isSelected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={isSelected}
            className={[
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isSelected
                ? "bg-white text-black shadow-sm dark:bg-white dark:text-black"
                : "text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white",
            ].join(" ")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
