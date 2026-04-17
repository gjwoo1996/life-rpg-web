"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
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

export function AppHeader() {
  const [sideOpen, setSideOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
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

  const handleClearHistory = async () => {
    setSideOpen(false);
    const ok = window.confirm("대화 기록이 모두 삭제됩니다. 계속할까요?");
    if (!ok) return;
    setClearing(true);
    try {
      await api.chat.clearHistory();
      window.location.href = "/";
    } catch {
      // ignore
    } finally {
      setClearing(false);
    }
  };

  return (
    <>
      <header className="w-full flex items-center gap-3 px-4 py-3 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-700">
        <button
          type="button"
          onClick={() => setSideOpen(true)}
          className="p-2 rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
          aria-label="메뉴"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link
          href="/"
          className="text-xl font-bold text-zinc-900 dark:text-zinc-100 truncate hover:underline"
        >
          일본어 학습 AI
        </Link>
      </header>

      {sideOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          aria-hidden
          onClick={() => setSideOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 h-full w-64 max-w-[85vw] bg-white dark:bg-zinc-900 shadow-xl transition-transform duration-200 ease-out ${
          sideOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="사이드 메뉴"
      >
        <div className="flex flex-col h-full pt-6 pb-4">
          <div className="px-4 mb-4">
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">메뉴</span>
          </div>
          <nav className="flex-1">
            <Link
              href="/"
              className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onClick={() => setSideOpen(false)}
            >
              <svg className="w-5 h-5 shrink-0 text-zinc-500 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              홈 (채팅)
            </Link>
          </nav>

          <div className="border-t border-zinc-200 dark:border-zinc-700 px-4 pt-4 pb-2">
            <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 block mb-2">폰트</span>
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
              onClick={handleClearHistory}
              disabled={clearing}
              className="flex items-center gap-3 w-full text-left px-4 py-2.5 rounded-lg text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
            >
              <svg className="w-5 h-5 shrink-0 text-zinc-500 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              {clearing ? "초기화 중..." : "대화 초기화"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
