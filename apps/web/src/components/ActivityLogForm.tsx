"use client";

import { useState } from "react";
import { api } from "@/lib/api";

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

interface ActivityLogFormProps {
  characterId: string;
  onCreated?: () => void;
}

export function ActivityLogForm({ characterId, onCreated }: ActivityLogFormProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const date = todayYmd();
      await api.activity.create({
        characterId,
        date,
        content: content.trim(),
      });
      setContent("");
      onCreated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const today = todayYmd();

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 mb-4 p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-sm"
    >
      <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 text-sm">
        <span>날짜</span>
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {today}
        </span>
        <span className="text-zinc-400 dark:text-zinc-500">
          (오늘만 기록 가능)
        </span>
      </div>
      {loading && (
        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
          <span
            className="inline-block h-5 w-5 shrink-0 rounded-full border-2 border-current border-t-transparent animate-spin"
            aria-hidden
          />
          <span>AI가 활동을 분석 중입니다...</span>
        </div>
      )}
      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="오늘 한 활동을 기록하세요. 저장 시 AI가 분석해 경험치를 부여합니다."
        rows={3}
        className="w-full px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={loading || !content.trim()}
        className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50 font-medium transition-colors"
      >
        {loading ? "분석 중..." : "기록 저장"}
      </button>
    </form>
  );
}
