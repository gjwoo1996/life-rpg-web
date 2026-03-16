"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api, type CharacterDto } from "@/lib/api";
import {
  getStoredFont,
  setStoredFont,
  type FontOption,
} from "@/components/FontProvider";

const FONT_LABELS: Record<FontOption, string> = {
  jua: "Jua",
  gowun: "Gowun Dodum",
  "hi-melody": "Hi Melody",
};

interface AppHeaderProps {
  character?: CharacterDto | null;
}

export function AppHeader({ character }: AppHeaderProps) {
  const [sideOpen, setSideOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [font, setFont] = useState<FontOption | null>(null);

  useEffect(() => {
    setFont(getStoredFont());
  }, [sideOpen]);

  useEffect(() => {
    if (sideOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [sideOpen]);

  const handleReset = async () => {
    setSideOpen(false);
    const ok = window.confirm(
      "캐릭터·목표·활동 기록이 모두 삭제됩니다. 계속할까요?"
    );
    if (!ok) return;
    setResetting(true);
    try {
      await api.reset();
      window.location.href = "/";
    } catch {
      // ignore
    } finally {
      setResetting(false);
    }
  };

  const activityHref = character ? `/activity?characterId=${character.id}` : "/activity";
  const analysisHref = character ? `/analysis?characterId=${character.id}` : "/analysis";
  const growthHref = character ? `/growth?characterId=${character.id}` : "/growth";

  return (
    <>
      <header className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700">
        <button
          type="button"
          onClick={() => setSideOpen(true)}
          className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="메뉴"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
        <Link
          href="/"
          className="text-xl font-bold text-zinc-900 dark:text-zinc-100 truncate hover:underline"
        >
          Life RPG Web
        </Link>
      </header>

      {/* Overlay */}
      {sideOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          aria-hidden
          onClick={() => setSideOpen(false)}
        />
      )}

      {/* Side panel (Notion-style slide-in) */}
      <aside
        className={`fixed left-0 top-0 z-50 h-full w-64 max-w-[85vw] bg-white dark:bg-zinc-900 shadow-xl transition-transform duration-200 ease-out ${
          sideOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="사이드 메뉴"
      >
        <div className="flex flex-col h-full pt-6 pb-4">
          <div className="px-4 mb-4">
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              메뉴
            </span>
          </div>
          <nav className="flex-1">
            <Link
              href="/"
              className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onClick={() => setSideOpen(false)}
            >
              <svg
                className="w-5 h-5 shrink-0 text-zinc-500 dark:text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              홈
            </Link>
            <Link
              href="/character-test"
              className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onClick={() => setSideOpen(false)}
            >
              <svg
                className="w-5 h-5 shrink-0 text-zinc-500 dark:text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 17a4 4 0 100-8 4 4 0 000 8z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              캐릭터 성장 테스트
            </Link>
            <Link
              href={analysisHref}
              className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onClick={() => setSideOpen(false)}
            >
              <svg
                className="w-5 h-5 shrink-0 text-zinc-500 dark:text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              사용자 분석
            </Link>
            <Link
              href={activityHref}
              className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onClick={() => setSideOpen(false)}
            >
              <svg
                className="w-5 h-5 shrink-0 text-zinc-500 dark:text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              활동 캘린더
            </Link>
            <Link
              href={growthHref}
              className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onClick={() => setSideOpen(false)}
            >
              <svg
                className="w-5 h-5 shrink-0 text-zinc-500 dark:text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 17l6-6 4 4 8-8"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 7h4v4"
                />
              </svg>
              성장 그래프
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onClick={() => setSideOpen(false)}
            >
              <svg
                className="w-5 h-5 shrink-0 text-zinc-500 dark:text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              세팅
            </Link>
          </nav>
          <div className="border-t border-zinc-200 dark:border-zinc-700 px-4 pt-4 pb-2">
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 block mb-2">
              폰트
            </span>
            <div className="flex flex-col gap-1">
              {(["jua", "gowun", "hi-melody"] as const).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setStoredFont(key);
                    setFont(key);
                  }}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${
                    font === key
                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {FONT_LABELS[key]}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-zinc-200 dark:border-zinc-700 px-2 pt-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting}
              className="flex items-center gap-3 w-full text-left px-4 py-2.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
            >
              <svg
                className="w-5 h-5 shrink-0 text-zinc-500 dark:text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              {resetting ? "초기화 중..." : "초기화"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
