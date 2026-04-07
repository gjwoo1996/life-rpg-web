"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api, type CharacterDto, type GoalDto } from "@/lib/api";
import { AppHeader } from "@/components/AppHeader";

function AnalysisContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const characterId = searchParams.get("characterId");
  const [character, setCharacter] = useState<CharacterDto | null>(null);
  const [goals, setGoals] = useState<GoalDto[]>([]);
  const [goalAnalyses, setGoalAnalyses] = useState<Record<string, string | null>>({});
  const [regenerating, setRegenerating] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!characterId) {
      api.character
        .list()
        .then((list) => {
          if (list.length === 1) {
            const only = list[0];
            const params = new URLSearchParams(searchParams.toString());
            params.set("characterId", only.id);
            router.replace(`/analysis?${params.toString()}`);
          }
        })
        .catch(() => {});
      return;
    }

    api.character.get(characterId).then(setCharacter).catch(() => setCharacter(null));
    api.goal.list(characterId).then(setGoals).catch(() => setGoals([]));
  }, [characterId, router, searchParams]);

  const loadAllAnalyses = useCallback(() => {
    if (!characterId) return;
    api.analysis
      .getGoalsBatch(characterId)
      .then(setGoalAnalyses)
      .catch(() => setGoalAnalyses({}));
  }, [characterId]);

  useEffect(() => {
    if (!characterId || goals.length === 0) return;
    loadAllAnalyses();
  }, [characterId, goals, loadAllAnalyses]);

  const handleRegenerate = async (goalId: string) => {
    setRegenerating((prev) => ({ ...prev, [goalId]: true }));
    try {
      await api.analysis.generateGoal(goalId);
      const updated = await api.analysis.getGoal(goalId);
      setGoalAnalyses((prev) => ({
        ...prev,
        [goalId]: updated[0]?.content ?? null,
      }));
    } catch {
      // ignore
    } finally {
      setRegenerating((prev) => ({ ...prev, [goalId]: false }));
    }
  };

  if (!characterId) {
    return (
      <>
        <AppHeader />
        <div className="mx-auto max-w-6xl px-4 py-8">
          <p className="text-zinc-600 dark:text-zinc-400">
            분석을 보려면 캐릭터를 선택하세요.
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

  return (
    <>
      <AppHeader character={character ?? undefined} />
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            사용자 분석
          </h2>
          <button
            type="button"
            onClick={loadAllAnalyses}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            새로고침
          </button>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm">
          목표와 활동기록을 바탕으로 한 분석 결과입니다. 활동을 추가할 때마다
          목표별 누적 분석이 갱신됩니다.
        </p>
        {goals.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            등록된 목표가 없습니다.
          </p>
        ) : (
          <ul className="space-y-4">
            {goals.map((g) => (
              <li
                key={g.id}
                className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: g.calendarColor ?? "#6366f1" }}
                  />
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {g.title}
                  </span>
                  {g.targetSkill && (
                    <span className="text-zinc-500 dark:text-zinc-400 text-sm">
                      ({g.targetSkill})
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRegenerate(g.id)}
                    disabled={regenerating[g.id]}
                    className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                  >
                    {regenerating[g.id] ? (
                      <>
                        <span className="inline-block h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" aria-hidden />
                        분석 중...
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        분석 재생성
                      </>
                    )}
                  </button>
                </div>
                {goalAnalyses[g.id] ? (
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm whitespace-pre-wrap mt-2 pl-5">
                    {goalAnalyses[g.id]}
                  </p>
                ) : (
                  <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-2 pl-5">
                    아직 목표별 누적 분석이 없습니다. 활동을 기록하면 분석이
                    생성됩니다.
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={<div className="p-8 text-zinc-500">로딩 중...</div>}>
      <AnalysisContent />
    </Suspense>
  );
}
