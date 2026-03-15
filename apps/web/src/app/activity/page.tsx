"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type GoalDto, type CharacterDto } from "@/lib/api";
import { AppHeader } from "@/components/AppHeader";

function getMonthDays(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: Date[] = [];
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  const startPad = first.getDay();
  for (let i = 0; i < startPad; i++) {
    days.unshift(new Date(year, month, -startPad + i + 1));
  }
  return days;
}

function dateToYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isSameMonth(d: Date, year: number, month: number): boolean {
  return d.getFullYear() === year && d.getMonth() === month;
}

function ActivityContent() {
  const searchParams = useSearchParams();
  const characterId = searchParams.get("characterId");
  const [goals, setGoals] = useState<GoalDto[]>([]);
  const [character, setCharacter] = useState<CharacterDto | null>(null);
  const [dayLogCounts, setDayLogCounts] = useState<Record<string, number>>({});
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());

  useEffect(() => {
    if (!characterId) return;
    api.goal.list(characterId).then(setGoals).catch(() => setGoals([]));
    api.character.get(characterId).then(setCharacter).catch(() => setCharacter(null));
  }, [characterId]);

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const monthStartStr = dateToYmd(monthStart);
  const monthEndStr = dateToYmd(monthEnd);

  useEffect(() => {
    if (!characterId || !monthStartStr || !monthEndStr) return;
    api.activity
      .list(characterId, monthStartStr, monthEndStr)
      .then((logs) => {
        const counts: Record<string, number> = {};
        for (const log of logs) {
          const d = log.date;
          const ymd =
            typeof d === "string"
              ? d.slice(0, 10)
              : d
                ? new Date(d).toISOString().slice(0, 10)
                : "";
          if (ymd) counts[ymd] = (counts[ymd] ?? 0) + 1;
        }
        setDayLogCounts(counts);
      })
      .catch(() => setDayLogCounts({}));
  }, [characterId, monthStartStr, monthEndStr]);

  if (!characterId) {
    return (
      <>
        <AppHeader />
        <div className="mx-auto max-w-6xl px-4 py-8">
          <p className="text-zinc-600 dark:text-zinc-400">
            캘린더를 보려면 캐릭터를 선택하세요.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-amber-600 dark:text-amber-400 font-medium"
          >
            홈으로 →
          </Link>
        </div>
      </>
    );
  }

  const days = getMonthDays(year, month);
  const activityCellColor = character?.activityCalendarColor ?? "#FEF3C7";

  const activeGoalsInRange = goals.filter((g) => {
    if (!g.startDate || !g.endDate) return false;
    const start = new Date(g.startDate);
    const end = new Date(g.endDate);
    return start <= monthEnd && end >= monthStart;
  });

  const goPrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const goNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  const years = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => i);

  return (
    <>
      <AppHeader character={character ?? { id: characterId, name: "", createdAt: "" }} />
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          활동 캘린더
        </h2>
        <div className="flex items-center gap-3">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-lg border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label="년도 선택"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}년
              </option>
            ))}
          </select>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="rounded-lg border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label="월 선택"
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {m + 1}월
              </option>
            ))}
          </select>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={goPrevMonth}
              className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              aria-label="이전 달"
            >
              ←
            </button>
            <button
              type="button"
              onClick={goNextMonth}
              className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              aria-label="다음 달"
            >
              →
            </button>
          </div>
        </div>
      </div>

      <div className="border-2 border-zinc-300 dark:border-zinc-600 rounded-lg overflow-hidden">
        <div className="grid grid-cols-7 gap-px bg-zinc-200 dark:bg-zinc-700">
          {["일", "월", "화", "수", "목", "금", "토"].map((w) => (
            <div
              key={w}
              className="bg-zinc-50 dark:bg-zinc-800/80 font-medium text-zinc-500 dark:text-zinc-400 text-xs py-2 px-1 text-center"
            >
              {w}
            </div>
          ))}
          {days.map((d) => {
            const ymd = dateToYmd(d);
            const inMonth = isSameMonth(d, year, month);
            const logCount = dayLogCounts[ymd] ?? 0;
            const hasActivity = logCount > 0;
            const dayGoals = activeGoalsInRange.filter((g) => {
              if (!g.startDate || !g.endDate) return false;
              const start = new Date(g.startDate);
              const end = new Date(g.endDate);
              const t = new Date(ymd);
              return t >= start && t <= end;
            });

            const cellBg = inMonth
              ? "bg-white dark:bg-zinc-900"
              : "bg-zinc-100 dark:bg-zinc-700/60";

            return (
              <Link
                key={ymd}
                href={`/activity/${ymd}?characterId=${characterId}`}
                className={`aspect-square p-1.5 flex flex-col text-left transition-colors min-h-0 ${cellBg} hover:ring-2 hover:ring-amber-400 hover:ring-inset`}
              >
                <span
                  className={
                    inMonth
                      ? "text-zinc-900 dark:text-zinc-100 font-medium text-sm"
                      : "text-zinc-400 dark:text-zinc-500 text-sm"
                  }
                >
                  {d.getDate()}
                </span>
                <div className="flex flex-col gap-1 mt-0.5 min-h-0 overflow-hidden">
                  {dayGoals.map((g) => (
                    <span
                      key={g.id}
                      className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium text-white truncate max-w-full"
                      style={{
                        backgroundColor: g.calendarColor ?? "#6366f1",
                      }}
                      title={g.title}
                    >
                      {g.title}
                    </span>
                  ))}
                  {hasActivity && dayGoals.length === 0 && (
                    <span
                      className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate"
                      style={{
                        backgroundColor: activityCellColor,
                      }}
                    >
                      활동 {logCount}개
                    </span>
                  )}
                  {hasActivity && dayGoals.length > 0 && (
                    <span
                      className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate"
                      style={{
                        backgroundColor: activityCellColor,
                      }}
                    >
                      활동 {logCount}개
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      </div>
    </>
  );
}

export default function ActivityPage() {
  return (
    <Suspense fallback={<div className="p-8 text-zinc-500">로딩 중...</div>}>
      <ActivityContent />
    </Suspense>
  );
}
