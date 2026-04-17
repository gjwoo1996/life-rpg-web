const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001")
    : process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  const text = await res.text();
  if (!text) return null as T;
  return JSON.parse(text) as T;
}

export type ChatMessageDto = {
  id: string;
  role: "user" | "assistant";
  content: string;
  hasImage: boolean;
  createdAt: string;
};

export type JlptAnalysisDto = {
  id: string;
  level: "N1" | "N2" | "N3" | "N4" | "N5";
  vocabularyScore: number;
  grammarScore: number;
  readingScore: number;
  totalScore: number;
  messageCount: number;
  analysisDetail: string | null;
  analyzedAt: string;
};

export type ChatModelDto = {
  id: string;
  label: string;
  isDefault: boolean;
};

export const API_BASE_URL = API_BASE;

export const api = {
  chat: {
    getModels: () => request<ChatModelDto[]>("/chat/models"),
    getHistory: (limit?: number) =>
      request<ChatMessageDto[]>(
        limit ? `/chat/history?limit=${limit}` : "/chat/history"
      ),
    clearHistory: () =>
      request<{ ok: boolean }>("/chat/history", { method: "DELETE" }),
  },
  jlpt: {
    getLatest: () => request<JlptAnalysisDto | null>("/jlpt"),
    analyze: () =>
      request<JlptAnalysisDto>("/jlpt/analyze", { method: "POST" }),
  },
};
