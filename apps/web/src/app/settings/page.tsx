"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type GoalDto } from "@/lib/api";
import { AppHeader } from "@/components/AppHeader";

export default function SettingsPage() {
  const [goals, setGoals] = useState<GoalDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  useEffect(() => {
    api.goal
      .list()
      .then((list) => {
        setGoals(list);
        const initial: Record<string, string> = {};
        list.forEach((g) => {
          initial[g.id] = g.goalAnalysisUserInstruction ?? "";
        });
        setEditing(initial);
      })
      .catch(() => setGoals([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (goalId: string) => {
    const value = editing[goalId]?.trim() || null;
    setSaving((prev) => ({ ...prev, [goalId]: true }));
    try {
      await api.goal.update(goalId, {
        goalAnalysisUserInstruction: value,
      });
      setGoals((prev) =>
        prev.map((g) =>
          g.id === goalId ? { ...g, goalAnalysisUserInstruction: value } : g
        )
      );
    } finally {
      setSaving((prev) => ({ ...prev, [goalId]: false }));
    }
  };

  return (
    <>
      <AppHeader />
      <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          세팅
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm">
          목표별로 사용자(목표) 분석 시 <strong>추가로 반영할 말</strong>을 한
          줄로 적을 수 있습니다. 비워두면 기본 분석만 사용됩니다.
        </p>

        {loading ? (
          <p className="text-zinc-500 dark:text-zinc-400">로딩 중...</p>
        ) : goals.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-6 text-center">
            <p className="text-zinc-600 dark:text-zinc-400">
              목표를 추가한 후 목표별 LLM 설정을 할 수 있습니다.
            </p>
            <Link
              href="/"
              className="mt-4 inline-block text-amber-600 dark:text-amber-400 font-medium hover:underline"
            >
              홈으로 가기
            </Link>
          </div>
        ) : (
          <ul className="space-y-6">
            {goals.map((g) => (
              <li
                key={g.id}
                className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              >
                <div className="flex items-center gap-2 mb-3">
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
                <label className="block text-sm text-zinc-600 dark:text-zinc-400 mb-1.5">
                  추가로 분석에 반영할 말 (선택)
                </label>
                <input
                  type="text"
                  value={editing[g.id] ?? ""}
                  onChange={(e) =>
                    setEditing((prev) => ({ ...prev, [g.id]: e.target.value }))
                  }
                  placeholder="예: 격려를 많이 해줘, 구체적인 개선점 위주로"
                  maxLength={500}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={() => handleSave(g.id)}
                  disabled={saving[g.id]}
                  className="mt-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                >
                  {saving[g.id] ? "저장 중..." : "저장"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
