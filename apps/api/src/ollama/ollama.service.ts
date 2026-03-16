import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const DEFAULT_MODEL = process.env.LIFERPG_LLM_MODEL_DEFAULT || 'qwen2.5:7b';

const LLM_VERBOSE = process.env.LIFERPG_LLM_VERBOSE === 'true';
const RESPONSE_PREVIEW_LEN = 200;

const KOREAN_ONLY_SYSTEM =
  '반드시 한국어로만 답변해야 합니다. 영어, 일본어, 중국어 등 다른 언어를 사용하지 마세요. 출력 내용은 모두 한국어여야 하며, 다른 언어를 섞어 쓰지 마세요.';

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  private readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl =
      this.config.get<string>(
        'OLLAMA_HOST',
        'http://host.docker.internal:11434',
      ) || 'http://host.docker.internal:11434';
  }

  private async post<T>(path: string, body?: object): Promise<T> {
    this.logger.log(`[LLM Request] ${path} body=${JSON.stringify(body ?? {})}`);
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      this.logger.warn(`[LLM Error] ${res.status} ${res.statusText}`);
      throw new Error(`Ollama request failed: ${res.status} ${res.statusText}`);
    }
    const data = (await res.json()) as T;
    const dataObj = data as Record<string, unknown>;
    if (dataObj?.response != null && typeof dataObj.response === 'string') {
      const text = dataObj.response;
      if (LLM_VERBOSE) {
        this.logger.log(`[LLM Response] ${path} response=${text}`);
      } else {
        const preview =
          text.length <= RESPONSE_PREVIEW_LEN
            ? text
            : text.slice(0, RESPONSE_PREVIEW_LEN) + '…';
        this.logger.log(
          `[LLM Response] ${path} length=${text.length} preview=${preview}`,
        );
      }
    } else if (
      dataObj?.message != null &&
      typeof (dataObj.message as { content?: string }).content === 'string'
    ) {
      const text = (dataObj.message as { content: string }).content;
      if (LLM_VERBOSE) {
        this.logger.log(`[LLM Response] ${path} message.content=${text}`);
      } else {
        const preview =
          text.length <= RESPONSE_PREVIEW_LEN
            ? text
            : text.slice(0, RESPONSE_PREVIEW_LEN) + '…';
        this.logger.log(
          `[LLM Response] ${path} length=${text.length} preview=${preview}`,
        );
      }
    } else {
      this.logger.log(
        `[LLM Response] ${path} data=${JSON.stringify(data).slice(0, 300)}…`,
      );
    }
    return data;
  }

  /** Call Ollama /api/generate (single prompt, matches life-rpg). */
  async generateRaw(prompt: string, model?: string): Promise<string> {
    const m = model || DEFAULT_MODEL;
    const result = await this.post<{ response: string }>('/api/generate', {
      model: m,
      prompt,
      stream: false,
    });
    return (result?.response ?? '').trim();
  }

  async chat(model: string, messages: OllamaChatMessage[]): Promise<string> {
    const result = await this.post<{ message: { content: string } }>(
      '/api/chat',
      { model, messages, stream: false },
    );
    return result.message?.content ?? '';
  }

  async generate(
    model: string,
    prompt: string,
    system?: string,
  ): Promise<string> {
    const messages: OllamaChatMessage[] = [];
    if (system) messages.push({ role: 'system', content: system });
    messages.push({ role: 'user', content: prompt });
    return this.chat(model, messages);
  }

  /** 한국어 전용 출력으로 생성 (system 메시지로 언어 강제) */
  async generateInKoreanOnly(prompt: string, model?: string): Promise<string> {
    const m = model || DEFAULT_MODEL;
    return this.generate(m, prompt, KOREAN_ONLY_SYSTEM);
  }

  /** 활동 로그를 분석해 요약/인사이트 생성 (life-rpg ai/client.rs analyze_activity 이식) */
  async analyzeActivity(
    activityContent: string,
    model = 'llama3.2',
  ): Promise<string> {
    const prompt = `다음은 사용자의 활동 로그입니다. 이 활동의 핵심 내용과 인사이트를 2~3문장으로 간단히 정리해 주세요.

활동 로그:
${activityContent}

요약/인사이트:`;
    return this.generate(model, prompt, KOREAN_ONLY_SYSTEM);
  }

  /** 콘텐츠 요약 (life-rpg ai/prompt.rs build_summary_prompt 이식) - 한국어 한 문장 80자 이내 */
  async summarizeContent(content: string, model?: string): Promise<string> {
    const prompt = `다음 활동 내용을 한국어 한 문장(80자 이내)으로 짧게 요약해 주세요. 따옴표나 접두어 없이 요약 문장만 출력하세요.

활동 내용: ${content}
요약:`;
    return this.generateInKoreanOnly(prompt, model);
  }

  /** 능력별 XP 분석 (life-rpg ai/client.rs analyze_activity) - JSON { "능력명": XP숫자 } 반환 */
  async analyzeActivityXp(
    content: string,
    abilityNames: string[],
    model?: string,
  ): Promise<Record<string, number>> {
    if (abilityNames.length === 0) return {};
    const rule = this.tryRuleBased(content);
    if (rule) {
      return this.filterToAbilities(rule, abilityNames);
    }
    const keys = abilityNames.map((s) => `"${s}"`).join(', ');
    const example = abilityNames
      .map((s, i) => `"${s}": ${(i + 1) % 4}`)
      .join(', ');
    const prompt = `다음 활동 내용을 읽고 각 능력치별로 경험치(XP)를 0~30 사이의 정수로 배분해 주세요.

활동 내용: ${content}

반환 형식: 아래 능력 이름들을 키로 가지는 JSON 객체만 반환하세요. 값은 0~30 사이의 정수입니다.
키 목록: ${keys}
예시: {${example}}

JSON 이외의 다른 설명이나 텍스트는 절대 포함하지 마세요.`;
    const text = await this.generateRaw(prompt, model);
    const jsonStr = text
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonStr) as Record<string, unknown>;
    } catch {
      return this.filterToAbilities({}, abilityNames);
    }
    const result: Record<string, number> = {};
    for (const name of abilityNames) {
      const v = parsed[name];
      result[name] = typeof v === 'number' ? v : 0;
    }
    return result;
  }

  private filterToAbilities(
    m: Record<string, number>,
    abilityNames: string[],
  ): Record<string, number> {
    const out: Record<string, number> = {};
    for (const name of abilityNames) {
      out[name] = m[name] ?? 0;
    }
    return out;
  }

  /** 규칙 기반 XP (life-rpg ai/rules.rs 이식) - 매칭 시 LLM 호출 생략 */
  private tryRuleBased(content: string): Record<string, number> | null {
    const lower = content.toLowerCase();
    // "단어 N개" / "N개 단어"
    const wordMatch = lower.match(/(\d+)\s*개?\s*단어|단어\s*(\d+)\s*개?/);
    if (wordMatch) {
      const n = parseInt(wordMatch[1] || wordMatch[2] || '0', 10);
      if (n > 0) {
        const xp = Math.max(1, Math.floor(n * 0.1));
        return {
          intelligence: xp,
          discipline: Math.floor(xp / 2),
          focus: 0,
          knowledge: Math.floor(xp / 2),
          health: 0,
        };
      }
    }
    // "N시간 공부" / 공부·학습·study
    const hourMatch = lower.match(/(\d+)\s*시간/);
    if (
      hourMatch &&
      (lower.includes('공부') ||
        lower.includes('학습') ||
        lower.includes('study'))
    ) {
      const n = parseInt(hourMatch[1] || '0', 10);
      if (n > 0) {
        const xp = Math.max(1, n * 2);
        return {
          intelligence: xp,
          discipline: xp,
          focus: Math.floor(xp / 2),
          knowledge: xp,
          health: 0,
        };
      }
    }
    // "N분" 운동 / exercise
    if (lower.includes('운동') || lower.includes('exercise')) {
      const minMatch = lower.match(/(\d+)\s*분/);
      if (minMatch) {
        const n = parseInt(minMatch[1] || '0', 10);
        if (n > 0) {
          const xp = Math.max(1, Math.floor(n / 10));
          return {
            intelligence: 0,
            discipline: Math.floor(xp / 2),
            focus: 0,
            knowledge: 0,
            health: xp,
          };
        }
      }
    }
    return null;
  }

  /** 일일 분석 프롬프트 (life-rpg ai/prompt.rs build_daily_analysis_prompt) */
  buildDailyAnalysisPrompt(activitiesText: string): string {
    return `The following are the user's activity logs for one day. Write a brief 2-3 sentence analysis of the day (what was done, progress, or encouragement). 반드시 한국어로만 작성하세요. 일본어·중국어를 사용하지 마세요. Reply in Korean only.

Formatting: Write each sentence on a new line. Use line breaks between sentences so the answer is easy to read. Do not output one long continuous line.

Activities:
${activitiesText}
Analysis:`;
  }

  /** 목표 분석 프롬프트 (life-rpg ai/prompt.rs build_goal_analysis_prompt) */
  buildGoalAnalysisPrompt(
    goalName: string,
    targetAbility: string,
    previousContext: string,
    activitiesText: string,
  ): string {
    const prevBlock = previousContext
      ? `Previous summary/context:\n${previousContext}\n\n`
      : '';
    const activities = activitiesText || '(No activities yet)';
    return `Analyze progress toward this goal and give brief feedback.
Goal: ${goalName}
Target skill/ability: ${targetAbility}
${prevBlock}Recent activities:
${activities}

Write 2-4 sentences: progress so far, what to improve, and encouragement. 반드시 한국어로만 작성하세요. 일본어·중국어를 사용하지 마세요. Reply in Korean only. No prefix or label.

Formatting: Write each sentence on a new line. Use line breaks between sentences for readability. Do not output one long continuous line.`;
  }

  /** 사용자 정의 목표 분석 프롬프트 템플릿에 플레이스홀더 치환 */
  buildGoalAnalysisPromptFromTemplate(
    template: string,
    goalName: string,
    targetAbility: string,
    previousContext: string,
    activitiesText: string,
  ): string {
    return template
      .replace(/\{\{goalName\}\}/g, goalName)
      .replace(/\{\{targetAbility\}\}/g, targetAbility)
      .replace(/\{\{previousContext\}\}/g, previousContext)
      .replace(
        /\{\{activitiesText\}\}/g,
        activitiesText || '(No activities yet)',
      );
  }

  /** 고정 구조 목표 분석 프롬프트 (백엔드 고정 + 사용자 추가 지시) */
  buildGoalAnalysisPromptFixed(
    goalName: string,
    targetAbility: string,
    previousContext: string,
    activitiesText: string,
    userInstruction: string | null,
  ): string {
    const prevBlock = previousContext
      ? `이전 분석 요약:\n${previousContext}\n\n`
      : '';
    const activities = activitiesText || '(아직 활동 없음)';
    const userBlock = userInstruction?.trim()
      ? `\n추가로 다음을 반영해 주세요: ${userInstruction.trim()}\n\n`
      : '';
    return `목표: ${goalName}
스킬/능력: ${targetAbility}

${prevBlock}기간 내 활동:
${activities}
${userBlock}위 내용을 바탕으로 진행 상황, 개선점, 격려를 2~4문장 한국어로 작성해 주세요. 문장마다 줄바꿈 해 주세요.`;
  }
}
