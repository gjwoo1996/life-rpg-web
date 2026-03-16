"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type CharacterDto, type GoalDto } from "@/lib/api";
import { AppHeader } from "@/components/AppHeader";

function AnalysisContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const characterId = searchParams.get("characterId");
  const [character, setCharacter] = useState<CharacterDto | null>(null);
  const [goals, setGoals] = useState<GoalDto[]>([]);
  const [goalAnalyses, setGoalAnalyses] = useState<
    Record<string, string | null>
  >({});

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

  useEffect(() => {
    if (!characterId || goals.length === 0) return;
    const map: Record<string, string | null> = {};
    Promise.all(
      goals.map((g) =>
        api.analysis
          .getGoal(g.id)
          .then((arr: unknown) => {
            const list = Array.isArray(arr) ? arr : [];
            const latest = list[0];
            map[g.id] =
              latest && typeof latest === "object" && "content" in latest
                ? (latest as { content: string }).content
                : null;
          })
          .catch(() => {
            map[g.id] = null;
          })
      )
    ).then(() => setGoalAnalyses({ ...map }));
  }, [characterId, goals]);

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
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        사용자 분석
      </h2>
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
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{
                    backgroundColor: g.calendarColor ?? "#6366f1",
                  }}
                />
                <span className="font-medium text-zinc-900 dark:text-zinc-100">
                  {g.title}
                </span>
                {g.targetSkill && (
                  <span className="text-zinc-500 dark:text-zinc-400 text-sm">
                    ({g.targetSkill})
                  </span>
                )}
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
