"use client";

import { useState } from "react";
import { api } from "@/lib/api";

interface CharacterSetupProps {
  onCreated?: () => void;
}

export function CharacterSetup({ onCreated }: CharacterSetupProps) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    setLoading(true);
    try {
      await api.character.create({ name: name.trim() });
      setName("");
      onCreated?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <p className="text-zinc-600 dark:text-zinc-400 mb-6">
        캐릭터를 생성하여 성장을 시작하세요.
      </p>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 p-6 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-sm"
      >
        {error && (
          <p className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2"
          >
            캐릭터 이름
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름을 입력하세요"
            className="w-full px-4 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full py-2 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
        >
          {loading ? "생성 중..." : "캐릭터 생성"}
        </button>
      </form>
    </div>
  );
}
