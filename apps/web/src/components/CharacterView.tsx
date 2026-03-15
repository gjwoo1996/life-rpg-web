"use client";

import { useEffect, useState } from "react";
import { PixelCharacter } from "./PixelCharacter";
import { api, type CharacterDto, type AbilityStatDto, type GoalDto } from "@/lib/api";

const MAX_XP = 100;

function levelFromXp(xp: number): number {
  return Math.min(10, 1 + Math.floor(xp / 10));
}

interface CharacterViewProps {
  character: CharacterDto;
  goals?: GoalDto[];
}

export function CharacterView({ character, goals = [] }: CharacterViewProps) {
  const [abilityStats, setAbilityStats] = useState<AbilityStatDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!character?.id) return;
    api.ability
      .getStats(character.id)
      .then(setAbilityStats)
      .catch(() => setAbilityStats([]))
      .finally(() => setLoading(false));
  }, [character?.id]);

  const level = character.level ?? 1;
  const xp = character.xp ?? 0;

  return (
    <section className="flex flex-col md:flex-row gap-8 items-start p-6 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-sm">
      <PixelCharacter level={level} />
      <div className="flex-1 min-w-0 w-full">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
          {character.name}
        </h1>
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 mb-4">
          <div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">레벨</span>
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Lv.{level}</p>
          </div>
          <div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">현재 경험치</span>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{xp} XP</p>
          </div>
          {goals.length > 0 && (
            <div className="min-w-0">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">목표</span>
              <p className="text-base font-medium text-zinc-800 dark:text-zinc-200" title={goals.map((g) => g.title).join(", ")}>
                {goals.length}개 {goals.length <= 3 ? `· ${goals.map((g) => g.title).join(", ")}` : `· ${goals.slice(0, 2).map((g) => g.title).join(", ")} 외 ${goals.length - 2}개`}
              </p>
            </div>
          )}
        </div>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-6 bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {abilityStats.map((stat) => {
              const statLevel = levelFromXp(stat.xp);
              const pct = Math.min(100, (stat.xp / MAX_XP) * 100);
              return (
                <div key={stat.abilityId} className="group">
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 shrink-0">
                      {stat.name}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      Lv.{statLevel} ({stat.xp}/{MAX_XP})
                    </span>
                  </div>
                  <div className="relative h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500 dark:bg-amber-600 transition-all duration-500 ease-out"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {abilityStats.length === 0 && (
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                목표를 추가하면 능력이 여기에 표시됩니다.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
