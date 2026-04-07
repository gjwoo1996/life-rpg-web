"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import {
  api,
  type CharacterDto,
  type GoalDto,
  type ActivityLogDto,
} from "@/lib/api";
import { AppHeader } from "@/components/AppHeader";
import { CharacterView } from "@/components/CharacterView";
import { GoalList } from "@/components/GoalList";

function todayYmd(): string {
  const d = new Date();
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

function CharacterDetailContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const [character, setCharacter] = useState<CharacterDto | null>(null);
  const [goals, setGoals] = useState<GoalDto[]>([]);
  const [todayLogs, setTodayLogs] = useState<ActivityLogDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [abilityRefreshKey, setAbilityRefreshKey] = useState(0);

  const loadCharacter = useCallback(() => {
    if (!id) return;
    api.character
      .get(id)
      .then(setCharacter)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"));
  }, [id]);

  const loadGoals = useCallback(() => {
    if (!id) return;
    api.goal.list(id).then(setGoals).catch(() => setGoals([]));
  }, [id]);

  const loadTodayLogs = useCallback(() => {
    if (!id) return;
    const today = todayYmd();
    api.activity
      .list(id, today, today)
      .then(setTodayLogs)
      .catch(() => setTodayLogs([]));
  }, [id]);

  useEffect(() => {
    loadCharacter();
  }, [loadCharacter]);

  useEffect(() => {
    if (character?.id) {
      loadGoals();
      loadTodayLogs();
    }
  }, [character?.id, loadGoals, loadTodayLogs]);

  // 활동 저장 후 돌아왔을 때 능력치 재로드
  useEffect(() => {
    if (searchParams.get("refresh") === "1" && character?.id) {
      loadCharacter();
      loadTodayLogs();
      setAbilityRefreshKey((k) => k + 1);
      router.replace(`/characters/${id}`);
    }
  }, [searchParams, character?.id, id, loadCharacter, loadTodayLogs, router]);

  if (error)
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <Link
          href="/"
          className="mt-2 inline-block text-sm underline text-zinc-600 dark:text-zinc-400"
        >
          홈으로
        </Link>
      </div>
    );
  if (!character) return <p className="p-4 text-zinc-500 dark:text-zinc-400">로딩 중...</p>;

  return (
    <>
      <AppHeader character={character} />
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        <CharacterView character={character} goals={goals} refreshKey={abilityRefreshKey} />

      <section className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            목표 · 활동 기록
          </h2>
          <Link
            href={`/activity?characterId=${id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 px-3 py-2 text-sm font-medium text-white transition-colors"
          >
            활동 캘린더 보기
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* 목표 섹션 */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30 p-4">
          <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b-2 border-amber-500/50 dark:border-amber-400/50">
            <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
              목표
            </h3>
            <Link
              href={`/characters/${id}/goals/new`}
              className="inline-flex items-center justify-center px-3 py-1.5 text-sm rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors"
            >
              목표 추가
            </Link>
          </div>
          <GoalList goals={goals} />
        </div>

        {/* 활동 기록 섹션 */}
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/30 p-4">
          <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b-2 border-emerald-500/50 dark:border-emerald-400/50">
            <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
              활동 기록 (오늘)
            </h3>
            <Link
              href={`/characters/${id}/activity/new`}
              className="inline-flex items-center justify-center px-3 py-1.5 text-sm rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors"
            >
              활동기록 추가
            </Link>
          </div>
          {todayLogs.length === 0 ? (
            <p className="text-zinc-500 dark:text-zinc-400 text-sm py-2">
              오늘 기록된 활동이 없습니다.
            </p>
          ) : (
            <ul className="space-y-2">
              {todayLogs.map((log) => (
                <li
                  key={log.id}
                  className="py-2 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
                >
                  <p className="text-zinc-700 dark:text-zinc-300 text-sm whitespace-pre-wrap">
                    {log.content}
                  </p>
                  {(log.xpGained ?? 0) > 0 && (
                    <span className="text-amber-600 dark:text-amber-400 text-xs font-medium">
                      +{log.xpGained} XP
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      </div>
    </>
  );
}

export default function CharacterDetailPage() {
  return (
    <Suspense fallback={<p className="p-4 text-zinc-500 dark:text-zinc-400">로딩 중...</p>}>
      <CharacterDetailContent />
    </Suspense>
  );
}
