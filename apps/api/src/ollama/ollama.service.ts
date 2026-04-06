import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PromptBuilder } from './prompt-builder';
import { tryRuleBased, filterToAbilities } from './xp-rules';

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
    const rule = tryRuleBased(content);
    if (rule) {
      return filterToAbilities(rule, abilityNames);
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
      return filterToAbilities({}, abilityNames);
    }
    const result: Record<string, number> = {};
    for (const name of abilityNames) {
      const v = parsed[name];
      result[name] = typeof v === 'number' ? v : 0;
    }
    return result;
  }

  // --- 프롬프트 빌더 (PromptBuilder 위임) ---

  buildDailyAnalysisPrompt(activitiesText: string): string {
    return PromptBuilder.buildDailyAnalysis(activitiesText);
  }

  buildGoalAnalysisPrompt(
    goalName: string,
    targetAbility: string,
    previousContext: string,
    activitiesText: string,
  ): string {
    return PromptBuilder.buildGoalAnalysis(goalName, targetAbility, previousContext, activitiesText);
  }

  buildGoalAnalysisPromptFromTemplate(
    template: string,
    goalName: string,
    targetAbility: string,
    previousContext: string,
    activitiesText: string,
  ): string {
    return PromptBuilder.buildGoalAnalysisFromTemplate(template, goalName, targetAbility, previousContext, activitiesText);
  }

  buildGoalAnalysisPromptFixed(
    goalName: string,
    targetAbility: string,
    previousContext: string,
    activitiesText: string,
    userInstruction: string | null,
  ): string {
    return PromptBuilder.buildGoalAnalysisFixed(goalName, targetAbility, previousContext, activitiesText, userInstruction);
  }
}
