"use client";

import { useState, useEffect } from "react";
import { api, type AbilityStatDto } from "@/lib/api";

const PRESET_COLORS = [
  "#6366f1",
  "#22c55e",
  "#eab308",
  "#ef4444",
  "#ec4899",
  "#8b5cf6",
  "#0ea5e9",
  "#f97316",
];
const CUSTOM_ABILITY_VALUE = "__custom__";

interface GoalFormProps {
  characterId: string;
  onCreated?: () => void;
}

export function GoalForm({ characterId, onCreated }: GoalFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [abilities, setAbilities] = useState<AbilityStatDto[]>([]);
  const [targetSkill, setTargetSkill] = useState("");
  const [customAbilityName, setCustomAbilityName] = useState("");
  const [calendarColor, setCalendarColor] = useState(PRESET_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stepTitle, setStepTitle] = useState("");
  const [stepDescription, setStepDescription] = useState("");
  const [stepStartDate, setStepStartDate] = useState("");
  const [stepEndDate, setStepEndDate] = useState("");
  const [steps, setSteps] = useState<
    {
      title: string;
      description?: string;
      startDate?: string;
      endDate?: string;
      order: number;
    }[]
  >([]);

  const canEditStepDates = !!startDate && !!endDate;

  useEffect(() => {
    if (!characterId) return;
    api.ability.getStats(characterId).then(setAbilities).catch(() => setAbilities([]));
  }, [characterId]);

  useEffect(() => {
    if (!canEditStepDates) {
      setStepStartDate("");
      setStepEndDate("");
    }
  }, [canEditStepDates]);

  const resolvedAbilityName =
    targetSkill === CUSTOM_ABILITY_VALUE ? customAbilityName.trim() : targetSkill;

  const handleAddStep = () => {
    if (!stepTitle.trim()) return;
    if ((stepStartDate || stepEndDate) && !canEditStepDates) {
      setError("목표 기간을 먼저 설정해야 스텝 기간을 입력할 수 있습니다.");
      return;
    }
    if (stepStartDate && stepEndDate && stepStartDate > stepEndDate) {
      setError("스텝 시작일은 종료일보다 늦을 수 없습니다.");
      return;
    }
    if (startDate && stepStartDate && stepStartDate < startDate) {
      setError("스텝 시작일은 목표 시작일 이전일 수 없습니다.");
      return;
    }
    if (endDate && stepEndDate && stepEndDate > endDate) {
      setError("스텝 종료일은 목표 종료일 이후일 수 없습니다.");
      return;
    }
    setSteps((prev) => [
      ...prev,
      {
        title: stepTitle.trim(),
        description: stepDescription.trim() || undefined,
        startDate: stepStartDate || undefined,
        endDate: stepEndDate || undefined,
        order: prev.length ? Math.max(...prev.map((s) => s.order)) + 1 : 0,
      },
    ]);
    setStepTitle("");
    setStepDescription("");
    setStepStartDate("");
    setStepEndDate("");
  };

  const handleRemoveStep = (order: number) => {
    setSteps((prev) => prev.filter((s) => s.order !== order));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !startDate || !endDate) return;
    setError(null);
    setLoading(true);
    try {
      const goal = await api.goal.create({
        characterId,
        title: name.trim(),
        description: description.trim() || undefined,
        startDate,
        endDate,
        targetSkill: resolvedAbilityName || "",
        calendarColor,
      });
      if (steps.length > 0) {
        await Promise.all(
          steps.map((s) =>
            api.goalStep.create({
              goalId: goal.id,
              title: s.title,
              description: s.description,
              startDate: s.startDate,
              endDate: s.endDate,
              order: s.order,
            })
          )
        );
      }
      setName("");
      setStartDate("");
      setEndDate("");
      setDescription("");
      setCustomAbilityName("");
      setSteps([]);
      setStepTitle("");
      setStepDescription("");
      setStepStartDate("");
      setStepEndDate("");
      if (targetSkill !== CUSTOM_ABILITY_VALUE) setTargetSkill("");
      onCreated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60";
  const labelClass = "block text-sm font-medium text-zinc-600 dark:text-zinc-400 mb-1";

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 p-4 rounded-xl bg-zinc-50/50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-700"
    >
      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="goal-name" className={labelClass}>
          목표 이름
        </label>
        <input
          id="goal-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: 개발 공부, 운동"
          className={inputClass}
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="goal-description" className={labelClass}>
          목표 내용
        </label>
        <textarea
          id="goal-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="이 목표를 통해 달성하고 싶은 내용을 자세히 적어주세요."
          rows={3}
          className={inputClass}
          disabled={loading}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="goal-start" className={labelClass}>
            시작일
          </label>
          <input
            id="goal-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputClass}
            disabled={loading}
          />
        </div>
        <div>
          <label htmlFor="goal-end" className={labelClass}>
            종료일
          </label>
          <input
            id="goal-end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={inputClass}
            disabled={loading}
          />
        </div>
      </div>

      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 space-y-4">
        <div>
          <span className={labelClass}>스텝 설정 (선택)</span>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            이 목표를 달성하기 위해 거쳐야 할 작은 단계들을 미리 추가해 둘 수 있어요.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)] gap-3">
          <div className="space-y-2">
            <label
              htmlFor="step-title"
              className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1"
            >
              스텝 제목
            </label>
            <input
              id="step-title"
              type="text"
              value={stepTitle}
              onChange={(e) => setStepTitle(e.target.value)}
              placeholder="예: 강의 1~3강 듣기"
              className={inputClass}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              스텝 기간 (선택)
            </label>
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-2">
              <input
                id="step-start-date"
                type="date"
                value={stepStartDate}
                onChange={(e) => setStepStartDate(e.target.value)}
                className={inputClass}
                disabled={loading || !canEditStepDates}
                min={startDate || undefined}
                max={endDate || undefined}
              />
              <input
                id="step-end-date"
                type="date"
                value={stepEndDate}
                onChange={(e) => setStepEndDate(e.target.value)}
                className={inputClass}
                disabled={loading || !canEditStepDates}
                min={startDate || undefined}
                max={endDate || undefined}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="step-description"
            className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1"
          >
            스텝 내용 (선택)
          </label>
          <textarea
            id="step-description"
            rows={2}
            value={stepDescription}
            onChange={(e) => setStepDescription(e.target.value)}
            placeholder="이 단계에서 구체적으로 할 일을 적어두면 나중에 더 이해하기 쉬워요."
            className={inputClass}
            disabled={loading}
          />
        </div>

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={handleAddStep}
            disabled={loading || !stepTitle.trim()}
            className="px-4 py-1.5 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:opacity-50"
          >
            스텝 추가
          </button>
        </div>

        {steps.length > 0 && (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white/70 dark:bg-zinc-900/40 divide-y divide-zinc-100 dark:divide-zinc-800">
            {steps
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((s) => (
                <div
                  key={s.order}
                  className="flex items-start justify-between gap-3 px-3 py-2"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">
                        #{s.order}
                      </span>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
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
                  <button
                    type="button"
                    onClick={() => handleRemoveStep(s.order)}
                    className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-red-600 dark:hover:text-red-400"
                  >
                    삭제
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
        <span className={labelClass}>연결할 능력 (선택)</span>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          <select
            value={targetSkill}
            onChange={(e) => setTargetSkill(e.target.value)}
            className={`${inputClass} min-w-[140px] w-auto`}
            disabled={loading}
          >
            <option value="">선택 또는 직접 입력</option>
            {abilities.map((a) => (
              <option key={a.abilityId} value={a.name}>
                {a.name}
              </option>
            ))}
            <option value={CUSTOM_ABILITY_VALUE}>직접 입력</option>
          </select>
          {targetSkill === CUSTOM_ABILITY_VALUE && (
            <input
              type="text"
              value={customAbilityName}
              onChange={(e) => setCustomAbilityName(e.target.value)}
              placeholder="능력 이름 입력"
              className={`${inputClass} min-w-[120px] w-auto`}
              disabled={loading}
            />
          )}
        </div>
      </div>

      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700">
        <label className={labelClass}>캘린더 색상</label>
        <div className="flex items-center gap-3 mt-1">
          <input
            type="color"
            value={calendarColor}
            onChange={(e) => setCalendarColor(e.target.value)}
            className="w-9 h-9 rounded-lg border border-zinc-200 dark:border-zinc-600 cursor-pointer"
            disabled={loading}
          />
          <div className="flex flex-wrap gap-1.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCalendarColor(c)}
                className={`w-6 h-6 rounded-full border-2 transition-colors ${
                  calendarColor === c
                    ? "border-amber-500 ring-2 ring-amber-500/30"
                    : "border-zinc-200 dark:border-zinc-600 hover:border-zinc-400"
                }`}
                style={{ backgroundColor: c }}
                disabled={loading}
                aria-label={`색상 ${c}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50 font-medium transition-colors"
        >
          {loading ? "추가 중..." : "목표 추가"}
        </button>
      </div>
    </form>
  );
}
