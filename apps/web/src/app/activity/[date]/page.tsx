"use client";

import { Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type ActivityLogDto } from "@/lib/api";
import { AppHeader } from "@/components/AppHeader";

function ActivityDayContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const date = params.date as string;
  const characterId = searchParams.get("characterId");
  const [dayLogs, setDayLogs] = useState<ActivityLogDto[]>([]);
  const [dailyAnalysis, setDailyAnalysis] = useState<{ content: string } | null>(
    null
  );
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!characterId || !date) return;
    api.activity
      .list(characterId, date, date)
      .then(setDayLogs)
      .catch(() => setDayLogs([]));
    api.analysis
      .getDaily(characterId, date)
      .then((v: unknown) => {
        if (v && typeof v === "object" && "content" in v)
          setDailyAnalysis({ content: (v as { content: string }).content });
        else setDailyAnalysis(null);
      })
      .catch(() => setDailyAnalysis(null));
  }, [characterId, date]);

  const handleGenerate = async () => {
    if (!characterId || !date) return;
    setGenerating(true);
    try {
      const result = await api.analysis.generateDaily(characterId, date) as unknown;
      if (result && typeof result === "object" && "content" in result)
        setDailyAnalysis({ content: (result as { content: string }).content });
      else setDailyAnalysis(null);
    } catch {
      // ignore
    } finally {
      setGenerating(false);
    }
  };

  if (!date) return null;

  return (
    <>
      {characterId && (
        <AppHeader character={{ id: characterId, name: "", createdAt: "" }} />
      )}
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <div className="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-sm p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {date} 활동
          </h3>
          <div className="flex gap-2">
            {characterId && (
              <Link
                href={`/activity?characterId=${characterId}`}
                className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
              >
                캘린더로
              </Link>
            )}
          </div>
        </div>

        {dayLogs.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            이 날 기록된 활동이 없습니다.
          </p>
        ) : (
          <ul className="space-y-3">
            {dayLogs.map((log) => (
              <li
                key={log.id}
                className="p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/50"
              >
                <div className="flex justify-between items-start mb-1">
                  {(log.xpGained ?? 0) > 0 && (
                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                      +{log.xpGained} XP
                    </span>
                  )}
                </div>
                <p className="text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">
                  {log.content}
                </p>
                {log.summary && (
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
                    {log.summary}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}

        {(dayLogs.length > 0 || dailyAnalysis) && (
          <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
            <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              일일 분석
            </h4>
            {dailyAnalysis ? (
              <p className="text-zinc-600 dark:text-zinc-400 text-sm whitespace-pre-wrap">
                {dailyAnalysis.content}
              </p>
            ) : dayLogs.length > 0 && characterId ? (
              <div>
                <p className="text-zinc-400 dark:text-zinc-500 text-sm mb-2">
                  분석이 없습니다. 생성할까요?
                </p>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={generating}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm disabled:opacity-50"
                >
                  {generating ? "생성 중..." : "일일 분석 생성"}
                </button>
              </div>
            ) : (
              <p className="text-zinc-400 dark:text-zinc-500 text-sm">
                활동을 저장하면 분석이 생성됩니다.
              </p>
            )}
          </div>
        )}
        </div>
      </div>
    </>
  );
}

export default function ActivityDayPage() {
  return (
    <Suspense fallback={<div className="p-8 text-zinc-500">로딩 중...</div>}>
      <ActivityDayContent />
    </Suspense>
  );
}
