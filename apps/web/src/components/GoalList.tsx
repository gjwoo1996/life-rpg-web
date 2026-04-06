"use client";

import Link from "next/link";
import { type GoalDto } from "@/lib/api";

interface GoalListProps {
  goals: GoalDto[];
}

export function GoalList({ goals }: GoalListProps) {
  if (goals.length === 0) {
    return (
      <p className="text-zinc-500 dark:text-zinc-400 text-sm py-4">
        등록된 목표가 없습니다.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {goals.map((g) => {
        const start =
          g.startDate &&
          (typeof g.startDate === "string"
            ? g.startDate.slice(0, 10)
            : (g.startDate as Date).toISOString?.()?.slice(0, 10));
        const end =
          g.endDate &&
          (typeof g.endDate === "string"
            ? g.endDate.slice(0, 10)
            : (g.endDate as Date).toISOString?.()?.slice(0, 10));

        const totalSteps = g.steps?.length ?? 0;
        const completedSteps = g.steps?.filter((s) => s.completed).length ?? 0;
        const progressPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : null;

        return (
          <li
            key={g.id}
            className="border-b border-zinc-100 dark:border-zinc-800 last:border-0"
          >
            <Link
              href={`/goals/${g.id}/steps`}
              className="flex justify-between items-start gap-3 py-3 px-2 -mx-2 rounded-lg border border-transparent transition-colors hover:bg-amber-50/80 dark:hover:bg-amber-500/10 hover:border-amber-200/80 dark:hover:border-amber-500/50"
            >
              <div className="flex flex-col gap-1 min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{
                      backgroundColor: g.calendarColor ?? "#6366f1",
                    }}
                    aria-hidden
                  />
                  <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                    {g.title}
                  </span>
                  {(start || end) && (
                    <span className="text-zinc-500 dark:text-zinc-400 text-sm">
                      {start} ~ {end}
                    </span>
                  )}
                </div>
                {g.description && (
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2 whitespace-pre-wrap">
                    {g.description}
                  </p>
                )}
                {progressPct !== null && (
                  <div className="mt-1 space-y-0.5">
                    <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                      <span>
                        스텝 {completedSteps}/{totalSteps}
                      </span>
                      <span className={progressPct === 100 ? "text-emerald-600 dark:text-emerald-400 font-semibold" : ""}>
                        {progressPct}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${progressPct}%`,
                          backgroundColor: progressPct === 100 ? "#10b981" : (g.calendarColor ?? "#6366f1"),
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {g.targetSkill && (
                  <span className="text-amber-600 dark:text-amber-400 text-xs font-medium">
                    {g.targetSkill}
                  </span>
                )}
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  클릭하여 상세/스텝 보기
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
