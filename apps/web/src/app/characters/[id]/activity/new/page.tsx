"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, type CharacterDto } from "@/lib/api";
import { AppHeader } from "@/components/AppHeader";
import { ActivityLogForm } from "@/components/ActivityLogForm";

export default function NewActivityPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [character, setCharacter] = useState<CharacterDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.character
      .get(id)
      .then(setCharacter)
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Failed to load")
      );
  }, [id]);

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
        <ActivityLogForm
          characterId={id}
          onCreated={() => router.push(`/characters/${id}`)}
        />
      </div>
    </>
  );
}
