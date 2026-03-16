"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { api, type ActivityLogDto, type CharacterDto } from "@/lib/api";

type Period = "daily" | "weekly" | "monthly";

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatYmd(d: Date) {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

function GrowthContent() {
  const searchParams = useSearchParams();
  const [character, setCharacter] = useState<CharacterDto | null>(null);
  const [logs, setLogs] = useState<ActivityLogDto[]>([]);
  const [period, setPeriod] = useState<Period>("daily");
  const [loading, setLoading] = useState(true);

  const characterId = useMemo(() => {
    const fromUrl = searchParams.get("characterId");
    if (fromUrl) return fromUrl;
    return character?.id ?? null;
  }, [searchParams, character?.id]);

  useEffect(() => {
    if (characterId || character) return;
    api.character
      .list()
      .then((list) => {
        if (list.length === 1) {
          setCharacter(list[0]);
        }
      })
      .catch(() => {});
  }, [characterId, character]);

  useEffect(() => {
    const effectiveCharacterId = characterId ?? character?.id;
    if (!effectiveCharacterId) return;
    setLoading(true);
    const today = startOfDay(new Date());
    let from: Date;
    if (period === "daily") {
      from = today;
    } else if (period === "weekly") {
      const dow = today.getDay();
      from = new Date(today);
      from.setDate(from.getDate() - dow);
    } else {
      from = new Date(today.getFullYear(), today.getMonth(), 1);
    }
    const fromStr = formatYmd(from);
    const toStr = formatYmd(today);

    Promise.all([
      character ? Promise.resolve(character) : api.character.get(effectiveCharacterId),
      api.activity.list(effectiveCharacterId, fromStr, toStr),
    ])
      .then(([c, ls]) => {
        setCharacter(c);
        setLogs(ls);
      })
      .catch(() => {
        setLogs([]);
      })
      .finally(() => setLoading(false));
  }, [characterId, character, period]);

  const grouped = useMemo(() => {
    const map = new Map<string, { xp: number; count: number }>();
    for (const log of logs) {
      const date = log.date
        ? typeof log.date === "string"
          ? log.date.slice(0, 10)
          : new Date(log.date).toISOString().slice(0, 10)
        : "";
      if (!date) continue;
      const key = date;
      const prev = map.get(key) ?? { xp: 0, count: 0 };
      map.set(key, {
        xp: prev.xp + (log.xpGained ?? 0),
        count: prev.count + 1,
      });
    }
    const entries = Array.from(map.entries()).sort((a, b) =>
      a[0] < b[0] ? -1 : 1
    );
    return entries.map(([date, v]) => ({
      date,
      xp: v.xp,
      count: v.count,
    }));
  }, [logs]);

  const maxXp = grouped.reduce((m, g) => Math.max(m, g.xp), 0) || 1;

  return (
    <>
      <AppHeader character={character ?? undefined} />
      <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
              성장 그래프
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              최근 활동 기록에서 얻은 경험치를 기준으로 일/주/월 성장 흐름을
              확인합니다.
            </p>
          </div>
          <div className="inline-flex rounded-full bg-zinc-100 dark:bg-zinc-800 p-1">
            {[
              { id: "daily", label: "일간" },
              { id: "weekly", label: "주간" },
              { id: "monthly", label: "월간" },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPeriod(opt.id as Period)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  period === opt.id
                    ? "bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-sm"
                    : "text-zinc-500 dark:text-zinc-400"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </header>

        {loading ? (
          <div className="p-8 text-zinc-500 dark:text-zinc-400">로딩 중...</div>
        ) : !characterId ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            캐릭터가 1명만 있을 때 자동으로 성장 그래프를 보여줍니다. 먼저
            캐릭터를 생성해주세요.
          </p>
        ) : grouped.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            선택한 기간에 활동 기록이 없습니다. 활동을 기록하면 경험치 기반
            성장 그래프가 표시됩니다.
          </p>
        ) : (
          <section className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                경험치 성장
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                단위: 날짜별 총 XP / 기록 횟수
              </p>
            </div>
            <div className="relative h-48">
              <div className="absolute inset-0 grid grid-rows-4">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="border-t border-dashed border-zinc-200 dark:border-zinc-800"
                  />
                ))}
              </div>
              <div className="relative h-full flex items-end gap-2">
                {grouped.map((g) => {
                  const height = (g.xp / maxXp) * 100;
                  return (
                    <div
                      key={g.date}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <div className="flex flex-col items-center gap-0.5 h-32 justify-end">
                        <div
                          className="w-3 sm:w-4 rounded-t-md bg-amber-500 dark:bg-amber-400 transition-all"
                          style={{ height: `${Math.max(height, 8)}%` }}
                          title={`${g.date} / ${g.xp} XP`}
                        />
                      </div>
                      <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                        {g.date.slice(5)}
                      </span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                        {g.xp} XP · {g.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>
    </>
  );
}

export default function GrowthPage() {
  return (
    <Suspense fallback={<div className="p-8 text-zinc-500">로딩 중...</div>}>
      <GrowthContent />
    </Suspense>
  );
}

