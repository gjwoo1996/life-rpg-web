"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, type CharacterDto } from "@/lib/api";
import { AppHeader } from "@/components/AppHeader";
import { CharacterSetup } from "@/components/CharacterSetup";

export default function Home() {
  const router = useRouter();
  const [list, setList] = useState<CharacterDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.character
      .list()
      .then((characters) => {
        setList(characters);
        if (characters.length === 1) {
          router.replace(`/characters/${characters[0].id}`);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [router]);

  const handleCreated = () => {
    api.character
      .list()
      .then((characters) => {
        setList(characters);
        if (characters.length === 1) {
          router.replace(`/characters/${characters[0].id}`);
        }
      })
      .catch(() => {});
  };

  if (loading && list.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-zinc-500 dark:text-zinc-400">로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8">
        <p className="text-red-600 dark:text-red-400">API 오류: {error}</p>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          NestJS API가 실행 중인지 확인하세요 (기본 포트 3001).
        </p>
      </div>
    );
  }

  if (list.length >= 1) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-12">
        <p className="text-zinc-500 dark:text-zinc-400">캐릭터 정보로 이동 중...</p>
      </div>
    );
  }

  return (
    <>
      <AppHeader />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="py-4">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Life RPG Web
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 mb-6">
            캐릭터를 생성하여 성장을 시작하세요.
          </p>
          <CharacterSetup onCreated={handleCreated} />
        </div>
      </div>
    </>
  );
}
