"use client";

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
        return (
          <li
            key={g.id}
            className="flex justify-between items-center py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
          >
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{
                  backgroundColor: g.calendarColor ?? "#6366f1",
                }}
                aria-hidden
              />
              <span className="font-medium text-zinc-900 dark:text-zinc-100">
                {g.title}
              </span>
              {(start || end) && (
                <span className="text-zinc-500 dark:text-zinc-400 text-sm">
                  {start} ~ {end}
                </span>
              )}
            </div>
            {g.targetSkill && (
              <span className="text-amber-600 dark:text-amber-400 text-sm font-medium">
                {g.targetSkill}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
