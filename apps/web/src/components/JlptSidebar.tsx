"use client";

import { useState, useCallback } from "react";
import { api, type JlptAnalysisDto } from "@/lib/api";
import { JlptScoreBar } from "./JlptScoreBar";

const LEVEL_COLORS: Record<string, string> = {
  N1: "text-emerald-600 dark:text-emerald-400",
  N2: "text-blue-600 dark:text-blue-400",
  N3: "text-amber-600 dark:text-amber-400",
  N4: "text-orange-600 dark:text-orange-400",
  N5: "text-red-600 dark:text-red-400",
};

interface JlptSidebarProps {
  initial: JlptAnalysisDto | null;
}

export function JlptSidebar({ initial }: JlptSidebarProps) {
  const [analysis, setAnalysis] = useState<JlptAnalysisDto | null>(initial);
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = useCallback(async () => {
    setAnalyzing(true);
    try {
      const result = await api.jlpt.analyze();
      setAnalysis(result);
    } catch {
      // ignore
    } finally {
      setAnalyzing(false);
    }
  }, []);

  return (
    <aside className="w-72 shrink-0 border-l border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex flex-col p-4 gap-4">
      <div>
        <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-3 uppercase tracking-wide">
          JLPT 레벨
        </h2>

        {analysis ? (
          <>
            <div className="text-center mb-4">
              <span
                className={`text-5xl font-black ${LEVEL_COLORS[analysis.level] ?? "text-zinc-700 dark:text-zinc-300"}`}
              >
                {analysis.level}
              </span>
              <p className="text-xs text-zinc-400 mt-1">
                종합 점수 {analysis.totalScore}점
              </p>
            </div>

            <div className="mb-4">
              <JlptScoreBar label="어휘" score={analysis.vocabularyScore} />
              <JlptScoreBar label="문법" score={analysis.grammarScore} />
              <JlptScoreBar label="독해" score={analysis.readingScore} />
            </div>

            {analysis.analysisDetail && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed border-t border-zinc-100 dark:border-zinc-800 pt-3">
                {analysis.analysisDetail}
              </p>
            )}

            <p className="text-xs text-zinc-400 mt-2">
              메시지 {analysis.messageCount}개 기준 ·{" "}
              {new Date(analysis.analyzedAt).toLocaleDateString("ko-KR")}
            </p>
          </>
        ) : (
          <div className="text-center py-6 text-zinc-400 text-sm">
            <p>아직 분석 데이터가 없습니다.</p>
            <p className="text-xs mt-1">채팅 후 분석해보세요.</p>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleAnalyze}
        disabled={analyzing}
        className="mt-auto w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
      >
        {analyzing ? "분석 중..." : "JLPT 수준 분석"}
      </button>
    </aside>
  );
}
