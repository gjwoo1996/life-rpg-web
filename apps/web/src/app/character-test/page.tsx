"use client";

import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { PhaserCharacter } from "@/components/PhaserCharacter";

export default function CharacterTestPage() {
  const [level, setLevel] = useState(1);

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        <section className="space-y-4">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            캐릭터 성장 테스트
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            레벨 슬라이더를 움직여 도트 캐릭터의 변화를 확인해보세요. 실제 캐릭터
            레벨 로직과 연동하기 전에, 시각적인 변화를 실험하는 용도의 페이지입니다.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-8 items-start">
          <div className="flex items-center justify-center">
            <PhaserCharacter level={level} />
          </div>

          <div className="space-y-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                  현재 레벨
                </p>
                <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                  Lv.{level}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="test-level"
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                레벨 조절
              </label>
              <input
                id="test-level"
                type="range"
                min={1}
                max={50}
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
              <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>Lv.1</span>
                <span>Lv.25</span>
                <span>Lv.50</span>
              </div>
            </div>

            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-3 text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
              <p>레벨이 올라갈수록 캐릭터의 크기, 색상, 움직임이 조금씩 바뀝니다.</p>
              <p>
                추후 실제 스프라이트 시트(아트 리소스)를 적용할 때 이 페이지를 활용해
                단계별 연출을 검증할 수 있습니다.
              </p>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

