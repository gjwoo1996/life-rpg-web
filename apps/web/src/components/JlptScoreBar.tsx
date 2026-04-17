interface JlptScoreBarProps {
  label: string;
  score: number;
}

export function JlptScoreBar({ label, score }: JlptScoreBarProps) {
  const pct = Math.max(0, Math.min(100, score));
  const color =
    pct >= 85
      ? "bg-emerald-500"
      : pct >= 70
        ? "bg-blue-500"
        : pct >= 55
          ? "bg-amber-500"
          : pct >= 40
            ? "bg-orange-500"
            : "bg-red-400";

  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400 mb-1">
        <span>{label}</span>
        <span>{pct}점</span>
      </div>
      <div className="h-2 bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
