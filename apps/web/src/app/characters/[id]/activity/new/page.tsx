"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, type CharacterDto, type ActivityCreateResultDto } from "@/lib/api";
import { AppHeader } from "@/components/AppHeader";
import { ActivityLogForm } from "@/components/ActivityLogForm";

export default function NewActivityPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [character, setCharacter] = useState<CharacterDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [xpResult, setXpResult] = useState<ActivityCreateResultDto | null>(null);

  useEffect(() => {
    if (!id) return;
    api.character
      .get(id)
      .then(setCharacter)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load")
      );
  }, [id]);

  const handleCreated = (result: ActivityCreateResultDto) => {
    setXpResult(result);
    setTimeout(() => {
      router.push(`/characters/${id}?refresh=1`);
    }, 3000);
  };

  if (error)
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <Link
          href="/"
          className="mt-2 inline-block text-sm text-amber-600 dark:text-amber-400 font-medium"
        >
          홈으로
        </Link>
      </div>
    );
  if (!character)
    return <p className="p-4 text-zinc-500 dark:text-zinc-400">로딩 중...</p>;

  return (
    <>
      <AppHeader character={character} />
      <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/characters/${id}`}
            className="inline-flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium"
          >
            <span aria-hidden>←</span> 캐릭터로
          </Link>
          <span className="text-zinc-300 dark:text-zinc-600">|</span>
          <Link
            href={`/activity?characterId=${id}`}
            className="inline-flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium"
          >
            활동 캘린더 보기 <span aria-hidden>→</span>
          </Link>
        </div>
        <div className="pb-2 border-b-2 border-emerald-500/50 dark:border-emerald-400/50">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            활동 기록 추가
          </h2>
        </div>

        {xpResult ? (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 p-5 space-y-3">
            <p className="font-semibold text-emerald-700 dark:text-emerald-400 text-base">
              활동이 기록되었습니다!
            </p>
            {xpResult.ollamaFailed && (
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                AI 분석을 완료하지 못했습니다. XP는 기본값으로 처리됩니다.
              </p>
            )}
            {(xpResult.xpGained ?? 0) > 0 ? (
              <div className="space-y-1">
                <p className="text-amber-600 dark:text-amber-400 font-bold text-xl">
                  +{xpResult.xpGained} XP 획득
                </p>
                {xpResult.abilityXpChanges.length > 0 && (
                  <ul className="space-y-0.5">
                    {xpResult.abilityXpChanges.map((a) => (
                      <li key={a.name} className="text-sm text-zinc-600 dark:text-zinc-400">
                        {a.name}: <span className="text-amber-600 dark:text-amber-400 font-medium">+{a.xp} XP</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                이번 활동은 XP가 부여되지 않았습니다.
              </p>
            )}
            <p className="text-zinc-400 dark:text-zinc-500 text-xs">
              잠시 후 캐릭터 페이지로 이동합니다...
            </p>
            <Link
              href={`/characters/${id}?refresh=1`}
              className="inline-block text-sm text-amber-600 dark:text-amber-400 font-medium underline"
            >
              지금 이동 →
            </Link>
          </div>
        ) : (
          <ActivityLogForm
            characterId={id}
            onCreated={handleCreated}
          />
        )}
      </div>
    </>
  );
}
