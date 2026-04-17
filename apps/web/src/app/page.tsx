"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  api,
  type ChatMessageDto,
  type ChatModelDto,
  type JlptAnalysisDto,
} from "@/lib/api";
import { streamChatResponse, streamImageResponse } from "@/lib/sse";
import { AppHeader } from "@/components/AppHeader";
import { ChatBubble, StreamingBubble } from "@/components/ChatBubble";
import { ChatInput } from "@/components/ChatInput";
import { JlptSidebar } from "@/components/JlptSidebar";

export default function Home() {
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [streaming, setStreaming] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [jlptData, setJlptData] = useState<JlptAnalysisDto | null>(null);
  const [models, setModels] = useState<ChatModelDto[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>();
  const [loadError, setLoadError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([api.chat.getHistory(), api.jlpt.getLatest(), api.chat.getModels()])
      .then(([history, jlpt, modelOptions]) => {
        setMessages(history);
        setJlptData(jlpt);
        setModels(modelOptions);
        setSelectedModel(
          modelOptions.find((model) => model.isDefault)?.id ?? modelOptions[0]?.id,
        );
      })
      .catch((e) =>
        setLoadError(e instanceof Error ? e.message : "API 연결 실패")
      );
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  const handleSend = useCallback((message: string, model: string | undefined) => {
    if (isStreaming) return;
    setIsStreaming(true);
    setStreaming("");

    const userMsg: ChatMessageDto = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: message,
      hasImage: false,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    let accumulated = "";
    streamChatResponse(
      message,
      model,
      (chunk) => {
        accumulated += chunk;
        setStreaming(accumulated);
      },
      () => {
        const assistantMsg: ChatMessageDto = {
          id: `tmp-ai-${Date.now()}`,
          role: "assistant",
          content: accumulated,
          hasImage: false,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setStreaming("");
        setIsStreaming(false);
        api.jlpt.getLatest().then(setJlptData).catch(() => {});
      },
      () => {
        setStreaming("");
        setIsStreaming(false);
      },
    );
  }, [isStreaming]);

  const handleSendImage = useCallback((question: string, file: File) => {
    if (isStreaming) return;
    setIsStreaming(true);
    setStreaming("");

    const userMsg: ChatMessageDto = {
      id: `tmp-${Date.now()}`,
      role: "user",
      content: question || "이미지를 분석해주세요.",
      hasImage: true,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    let accumulated = "";
    streamImageResponse(
      question,
      file,
      (chunk) => {
        accumulated += chunk;
        setStreaming(accumulated);
      },
      () => {
        const assistantMsg: ChatMessageDto = {
          id: `tmp-ai-${Date.now()}`,
          role: "assistant",
          content: accumulated,
          hasImage: false,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setStreaming("");
        setIsStreaming(false);
      },
      () => {
        setStreaming("");
        setIsStreaming(false);
      },
    );
  }, [isStreaming]);

  return (
    <div className="flex flex-col h-screen bg-zinc-50 dark:bg-zinc-950">
      <AppHeader />

      <div className="flex flex-1 overflow-hidden">
        {/* 채팅 영역 */}
        <main className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {loadError && (
              <div className="text-center py-8">
                <p className="text-red-500 text-sm">{loadError}</p>
                <p className="text-zinc-400 text-xs mt-1">
                  NestJS API가 실행 중인지 확인하세요 (포트 3001)
                </p>
              </div>
            )}

            {!loadError && messages.length === 0 && !isStreaming && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-4xl mb-4">🇯🇵</div>
                <h2 className="text-xl font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  일본어 학습 AI
                </h2>
                <p className="text-zinc-400 text-sm max-w-sm">
                  일본어 단어, 문법, 예문 등 무엇이든 질문하거나
                  <br />
                  이미지를 업로드해서 일본어 텍스트를 분석해보세요.
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}

            {isStreaming && streaming && (
              <StreamingBubble content={streaming} />
            )}

            <div ref={bottomRef} />
          </div>

          <ChatInput
            onSend={handleSend}
            onSendImage={handleSendImage}
            models={models}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            disabled={isStreaming}
          />
        </main>

        {/* JLPT 사이드바 */}
        <JlptSidebar initial={jlptData} />
      </div>
    </div>
  );
}
