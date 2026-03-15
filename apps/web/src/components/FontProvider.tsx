"use client";

import { useEffect } from "react";

const FONT_STORAGE_KEY = "life-rpg-font";
export const FONT_CHANGED_EVENT = "life-rpg-font-changed";
export type FontOption = "jua" | "gowun" | "hi-melody";

export function getStoredFont(): FontOption | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(FONT_STORAGE_KEY);
  if (v === "jua" || v === "gowun" || v === "hi-melody") return v;
  return null;
}

function applyStoredFontToBody(): void {
  const stored = getStoredFont();
  if (typeof document === "undefined") return;
  if (stored) {
    document.body.dataset.font = stored;
  } else {
    delete document.body.dataset.font;
  }
}

export function setStoredFont(value: FontOption): void {
  localStorage.setItem(FONT_STORAGE_KEY, value);
  applyStoredFontToBody();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(FONT_CHANGED_EVENT, { detail: value }));
  }
}

export function FontProvider() {
  useEffect(() => {
    applyStoredFontToBody();
    const handleFontChanged = () => applyStoredFontToBody();
    window.addEventListener(FONT_CHANGED_EVENT, handleFontChanged);
    return () => window.removeEventListener(FONT_CHANGED_EVENT, handleFontChanged);
  }, []);
  return null;
}
