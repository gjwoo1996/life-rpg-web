"use client";

import { useState, useRef, useCallback } from "react";
import type { ChatModelDto } from "@/lib/api";

interface ChatInputProps {
  onSend: (message: string, model: string | undefined) => void;
  onSendImage: (question: string, file: File) => void;
  models: ChatModelDto[];
  selectedModel?: string;
  onModelChange: (model: string) => void;
  disabled?: boolean;
}

export function ChatInput({
  onSend,
  onSendImage,
  models,
  selectedModel,
  onModelChange,
  disabled,
}: ChatInputProps) {
  const [text, setText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed && !selectedFile) return;
    if (selectedFile) {
      onSendImage(trimmed, selectedFile);
      setSelectedFile(null);
    } else {
      onSend(trimmed, selectedModel);
    }
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }, [text, selectedFile, onSend, onSendImage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
    e.target.value = "";
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const imageItem = Array.from(e.clipboardData.items).find((item) =>
      item.type.startsWith("image/"),
    );
    if (!imageItem) return;
    e.preventDefault();
    const file = imageItem.getAsFile();
    if (file) {
      setSelectedFile(new File([file], file.name || "pasted-image.png", { type: file.type }));
    }
  };

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-700 p-4 bg-white dark:bg-zinc-900">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <label
            htmlFor="model-select"
            className="text-xs font-medium text-zinc-500 dark:text-zinc-400"
          >
            LLM 모델
          </label>
          <select
            id="model-select"
            value={selectedModel ?? ""}
            onChange={(e) => onModelChange(e.target.value)}
            disabled={disabled || models.length === 0 || !!selectedFile}
            className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-40"
          >
            {models.map((model) => (
              <option key={model.id} value={model.id}>
                {model.label}{model.isDefault ? " (기본)" : ""}
              </option>
            ))}
          </select>
        </div>
        {selectedFile && (
          <p className="text-[11px] text-zinc-400">
            이미지 분석은 선택값과 관계없이 `llava:7b`로 처리됩니다.
          </p>
        )}
      </div>
      {selectedFile && (
        <div className="flex items-center gap-2 mb-2 px-1">
          <span className="text-xs text-zinc-500 truncate max-w-[200px]">
            📷 {selectedFile.name}
          </span>
          <button
            type="button"
            onClick={() => setSelectedFile(null)}
            className="text-xs text-zinc-400 hover:text-red-500"
          >
            ✕
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="p-2 rounded-lg text-zinc-400 hover:text-amber-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 transition-colors shrink-0"
          aria-label="이미지 업로드"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          disabled={disabled}
          placeholder={selectedFile ? "이미지에 대해 질문하세요..." : "일본어에 대해 질문하세요..."}
          rows={1}
          className="flex-1 resize-none rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-4 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:opacity-40 overflow-hidden"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={disabled || (!text.trim() && !selectedFile)}
          className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white transition-colors shrink-0"
          aria-label="전송"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
