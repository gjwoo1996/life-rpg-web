/**
 * NestJS API 클라이언트 (life-rpg invoke() → HTTP 호출 대체)
 * NEXT_PUBLIC_API_URL 환경 변수 사용 (기본: http://localhost:3001)
 */

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
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export type CharacterDto = {
  id: string;
  name: string;
  level?: number;
  xp?: number;
  activityCalendarColor?: string | null;
  createdAt: string;
};

export type GoalDto = {
  id: string;
  characterId: string;
  title: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  targetSkill?: string | null;
  calendarColor?: string;
  goalAnalysisPromptTemplate?: string | null;
  goalAnalysisUserInstruction?: string | null;
  createdAt: string;
};

export type ActivityLogDto = {
  id: string;
  characterId: string;
  date?: string | null;
  content: string;
  summary?: string | null;
  aiResult?: string | null;
  xpGained?: number;
  createdAt: string;
};

export type AbilityStatDto = { abilityId: string; name: string; xp: number };

export const api = {
  character: {
    list: () => request<CharacterDto[]>("/character"),
    get: (id: string) => request<CharacterDto>(`/character/${id}`),
    create: (data: { name: string }) =>
      request<CharacterDto>("/character", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: { name?: string; level?: number; xp?: number; activityCalendarColor?: string | null }) =>
      request<CharacterDto>(`/character/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request(`/character/${id}`, { method: "DELETE" }),
  },

  goal: {
    list: (characterId?: string) =>
      request<GoalDto[]>(
        characterId ? `/goal?characterId=${characterId}` : "/goal"
      ),
    get: (id: string) => request<GoalDto>(`/goal/${id}`),
    create: (data: {
      characterId: string;
      title: string;
      description?: string;
      startDate: string;
      endDate: string;
      targetSkill: string;
      calendarColor?: string;
    }) =>
      request<GoalDto>("/goal", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: {
      title?: string;
      description?: string;
      startDate?: string;
      endDate?: string;
      targetSkill?: string;
      calendarColor?: string;
      goalAnalysisPromptTemplate?: string | null;
      goalAnalysisUserInstruction?: string | null;
    }) =>
      request(`/goal/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) => request(`/goal/${id}`, { method: "DELETE" }),
  },

  activity: {
    list: (
      characterId?: string,
      fromDate?: string,
      toDate?: string
    ) => {
      const params = new URLSearchParams();
      if (characterId) params.set("characterId", characterId);
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);
      const q = params.toString();
      return request<ActivityLogDto[]>(
        q ? `/activity?${q}` : "/activity"
      );
    },
    get: (id: string) => request<ActivityLogDto>(`/activity/${id}`),
    create: (data: {
      characterId: string;
      date: string;
      content: string;
    }) =>
      request<ActivityLogDto>("/activity", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (id: string) => request(`/activity/${id}`, { method: "DELETE" }),
  },

  ability: {
    list: (characterId?: string) =>
      request(
        characterId ? `/ability?characterId=${characterId}` : "/ability"
      ),
    getStats: (characterId: string) =>
      request<AbilityStatDto[]>(
        `/ability/stats?characterId=${encodeURIComponent(characterId)}`
      ),
    get: (id: string) => request(`/ability/${id}`),
    create: (data: { characterId: string; name: string }) =>
      request("/ability", { method: "POST", body: JSON.stringify(data) }),
    addStat: (data: { characterId: string; abilityId: string; xp: number }) =>
      request("/ability/stats", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: { name?: string }) =>
      request(`/ability/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) => request(`/ability/${id}`, { method: "DELETE" }),
  },

  analysis: {
    getDaily: (characterId: string, date: string) =>
      request(
        `/analysis/daily?characterId=${encodeURIComponent(characterId)}&date=${encodeURIComponent(date)}`
      ),
    getGoal: (goalId: string) =>
      request(`/analysis/goal/${goalId}`),
    generateDaily: (characterId: string, date: string) =>
      request("/analysis/daily/generate", {
        method: "POST",
        body: JSON.stringify({ characterId, date }),
      }),
    generateGoal: (goalId: string) =>
      request(`/analysis/goal/${goalId}/generate`, { method: "POST" }),
  },

  reset: () =>
    request<{ ok: boolean; message: string }>("/reset", { method: "POST" }),
};
