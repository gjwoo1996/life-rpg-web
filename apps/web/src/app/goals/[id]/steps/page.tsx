"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { api, type GoalDto, type GoalStepDto } from "@/lib/api";

export default function GoalStepsPage() {
  const params = useParams();
  const router = useRouter();
  const goalId = params.id as string;
  const [goal, setGoal] = useState<GoalDto | null>(null);
  const [steps, setSteps] = useState<GoalStepDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (!goalId) return;
    setLoading(true);
    Promise.all([api.goal.get(goalId), api.goalStep.list(goalId)])
      .then(([g, s]) => {
        setGoal(g);
        setSteps(s);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => setLoading(false));
  }, [goalId]);

  const nextOrder = useMemo(
    () => (steps.length ? Math.max(...steps.map((s) => s.order ?? 0)) + 1 : 0),
    [steps]
  );

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setStartDate("");
    setEndDate("");
  };

  const handleEdit = (step: GoalStepDto) => {
    setEditingId(step.id);
    setTitle(step.title);
    setDescription(step.description ?? "");
    setStartDate(step.startDate ? step.startDate.slice(0, 10) : "");
    setEndDate(step.endDate ? step.endDate.slice(0, 10) : "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalId || !title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        const updated = await api.goalStep.update(editingId, {
          title: title.trim(),
          description: description.trim() || null,
          startDate: startDate || null,
          endDate: endDate || null,
        });
        setSteps((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      } else {
        const created = await api.goalStep.create({
          goalId,
          title: title.trim(),
          description: description.trim() || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          order: nextOrder,
        });
        setSteps((prev) => [...prev, created].sort((a, b) => a.order - b.order));
      }
      resetForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("이 스텝을 삭제할까요?")) return;
    try {
      await api.goalStep.delete(id);
      setSteps((prev) => prev.filter((s) => s.id !== id));
      if (editingId === id) resetForm();
    } catch {
      // ignore
    }
  };

  if (loading) {
    return <div className="p-8 text-zinc-500 dark:text-zinc-400">로딩 중...</div>;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          type="button"
          onClick={() => router.back()}
          className="mt-3 text-sm text-amber-600 dark:text-amber-400 underline"
        >
          뒤로 가기
        </button>
      </div>
    );
  }

  return (
    <>
      <AppHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">
              목표 상세
            </p>
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{
                  backgroundColor: goal?.calendarColor ?? "#6366f1",
                }}
                aria-hidden
              />
              <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {goal?.title ?? "목표"}
              </h1>
            </div>
            <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-300">
              {(goal?.startDate || goal?.endDate) && (
                <p>
                  기간:{" "}
                  {goal?.startDate?.slice(0, 10) ?? "시작일 미설정"} ~{" "}
                  {goal?.endDate?.slice(0, 10) ?? "종료일 미설정"}
                </p>
              )}
              {goal?.targetSkill && (
                <p>연결된 능력: {goal.targetSkill}</p>
              )}
              {goal?.description && (
                <p className="whitespace-pre-wrap text-xs">
                  {goal.description}
                </p>
              )}
            </div>
          </div>
          <Link
            href={goal ? `/characters/${goal.characterId}` : "/"}
            className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium"
          >
            캐릭터로 돌아가기 →
          </Link>
        </div>

        <section className="grid grid-cols-1 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-6 items-start">
          <div className="space-y-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-4">
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
              스텝 목록
            </h2>
            {steps.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                아직 등록된 스텝이 없습니다. 오른쪽에서 첫 번째 스텝을 추가해보세요.
              </p>
            ) : (
              <ul className="space-y-2">
                {steps.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-800/40 px-3 py-2"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-400 dark:text-zinc-500">
                          #{s.order}
                        </span>
                        <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                          {s.title}
                        </p>
                      </div>
                      {(s.startDate || s.endDate) && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          기간:{" "}
                          {s.startDate ? s.startDate.slice(0, 10) : "시작일 미설정"} ~{" "}
                          {s.endDate ? s.endDate.slice(0, 10) : "종료일 미설정"}
                        </p>
                      )}
                      {s.description && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap">
                          {s.description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => handleEdit(s)}
                        className="px-2 py-0.5 rounded text-xs border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(s.id)}
                        className="px-2 py-0.5 rounded text-xs text-red-600 dark:text-red-400 hover:bg-red-50/70 dark:hover:bg-red-950/40"
                      >
                        삭제
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-xl bg-zinc-50/60 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700 p-4"
          >
            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}
            <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              {editingId ? "스텝 수정" : "새 스텝 추가"}
            </h2>
            <div>
              <label
                htmlFor="step-title"
                className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1"
              >
                스텝 제목
              </label>
              <input
                id="step-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-600 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                disabled={saving}
              />
            </div>
            <div>
              <label
                htmlFor="step-start-date"
                className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1"
              >
                기간 (선택)
              </label>
              <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2">
                <input
                  id="step-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-600 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  disabled={saving}
                  min={goal?.startDate?.slice(0, 10)}
                  max={goal?.endDate?.slice(0, 10)}
                />
                <input
                  id="step-end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-600 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  disabled={saving}
                  min={goal?.startDate?.slice(0, 10)}
                  max={goal?.endDate?.slice(0, 10)}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="step-description"
                className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1"
              >
                스텝 내용 (선택)
              </label>
              <textarea
                id="step-description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-600 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                disabled={saving}
              />
            </div>
            <div className="flex items-center justify-between gap-2 pt-1">
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                >
                  새 스텝 추가로 전환
                </button>
              )}
              <button
                type="submit"
                disabled={saving || !title.trim()}
                className="ml-auto px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium disabled:opacity-50"
              >
                {saving ? "저장 중..." : editingId ? "스텝 수정" : "스텝 추가"}
              </button>
            </div>
          </form>
        </section>

        {goal && (
          <section className="pt-4 border-t border-zinc-200 dark:border-zinc-700 flex items-center justify-between gap-3">
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              이 목표와 연결된 스텝들은 목표가 삭제되면 함께 삭제됩니다.
            </div>
            <button
              type="button"
              onClick={async () => {
                if (
                  !window.confirm(
                    "이 목표를 삭제하면 연결된 모든 스텝도 함께 삭제됩니다. 정말 삭제할까요?"
                  )
                )
                  return;
                try {
                  await api.goal.delete(goal.id);
                  if (goal.characterId) {
                    router.push(`/characters/${goal.characterId}`);
                  } else {
                    router.push("/");
                  }
                } catch {
                  // ignore
                }
              }}
              className="px-4 py-1.5 rounded-lg border border-red-300 dark:border-red-500 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50/70 dark:hover:bg-red-950/40"
            >
              목표 및 스텝 삭제
            </button>
          </section>
        )}
      </main>
    </>
  );
}

