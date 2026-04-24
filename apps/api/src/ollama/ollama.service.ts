import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { logError, logInfo, logWarn } from '../logging/structured-logger';
import { PromptBuilder } from './prompt-builder';

export interface OllamaChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  images?: string[];
}

const DEFAULT_MODEL = process.env.LIFERPG_LLM_MODEL_DEFAULT || 'qwen3:8b';
const FALLBACK_MODEL =
  process.env.LIFERPG_LLM_MODEL_FALLBACK || 'qwen2.5:7b';
const IMAGE_MODEL = process.env.LIFERPG_LLM_MODEL_IMAGE || 'qwen2.5vl:7b';

const LLM_VERBOSE = process.env.LIFERPG_LLM_VERBOSE === 'true';
const RESPONSE_PREVIEW_LEN = 200;

const JAPANESE_STUDY_ASSISTANT_SYSTEM = `
당신은 일본어 공부를 돕는 학습 어시스트입니다.
기본 원칙:
1. 설명, 피드백, 비교는 한국어로 명확하게 작성합니다.
2. 일본어 단어, 예문, 문법 형태, 활용형은 일본어 원문 그대로 제시합니다.
3. 사용자가 JSON 또는 고정 섹션 형식을 요구하면 반드시 그대로 따릅니다.
4. 불필요한 장문 서론은 쓰지 말고 바로 본문으로 답합니다.
`.trim();

export interface OllamaModelOption {
  id: string;
  label: string;
  isDefault: boolean;
}

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  readonly baseUrl: string;

  constructor(private readonly config: ConfigService) {
    this.baseUrl =
      this.config.get<string>(
        'OLLAMA_HOST',
        'http://host.docker.internal:11434',
      ) || 'http://host.docker.internal:11434';
  }

  private async post<T>(
    path: string,
    body: object | undefined,
    requestId?: string,
  ): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      logWarn(this.logger, {
        requestId,
        event: 'llm.request.failed',
        module: OllamaService.name,
        status: 'failed',
        httpStatus: res.status,
        error: `${res.status} ${res.statusText}`,
      });
      throw new Error(`Ollama request failed: ${res.status} ${res.statusText}`);
    }
    const data = (await res.json()) as T;
    if (LLM_VERBOSE) {
      logInfo(this.logger, {
        requestId,
        event: 'llm.request.completed',
        module: OllamaService.name,
        status: 'succeeded',
        preview: JSON.stringify(data).slice(0, RESPONSE_PREVIEW_LEN),
      });
    }
    return data;
  }

  private getFallbackModelOptions(): OllamaModelOption[] {
    return Array.from(new Set([DEFAULT_MODEL, FALLBACK_MODEL]))
      .map((model) => ({
        id: model,
        label: model,
        isDefault: model === DEFAULT_MODEL,
      }));
  }

  async getAvailableChatModels(): Promise<OllamaModelOption[]> {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`);
      if (!res.ok) {
        throw new Error(`Ollama tags failed: ${res.status} ${res.statusText}`);
      }

      const data = (await res.json()) as {
        models?: Array<{ model?: string; name?: string }>;
      };

      const models = (data.models ?? [])
        .map((entry) => entry.model ?? entry.name ?? '')
        .filter((model) => model);

      if (models.length === 0) {
        return this.getFallbackModelOptions();
      }

      const deduped = Array.from(
        new Set([DEFAULT_MODEL, FALLBACK_MODEL, ...models]),
      );

      return deduped.map((model) => ({
        id: model,
        label: model,
        isDefault: model === DEFAULT_MODEL,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logWarn(this.logger, {
        event: 'llm.models.fetch_failed',
        module: OllamaService.name,
        status: 'failed',
        error: message,
      });
      return this.getFallbackModelOptions();
    }
  }

  private async withModelFallback<T>(
    requestedModel: string | undefined,
    context: {
      requestId?: string;
      promptLength?: number;
      messageCount?: number;
    },
    runner: (model: string) => Promise<T>,
  ): Promise<T> {
    const primaryModel = requestedModel || DEFAULT_MODEL;
    try {
      return await runner(primaryModel);
    } catch (error) {
      const shouldFallback =
        !requestedModel &&
        primaryModel === DEFAULT_MODEL &&
        primaryModel !== FALLBACK_MODEL;
      if (!shouldFallback) throw error;
      const reason = error instanceof Error ? error.message : 'unknown error';
      logWarn(this.logger, {
        requestId: context.requestId,
        event: 'llm.request.fallback_started',
        module: OllamaService.name,
        status: 'started',
        model: primaryModel,
        fallbackModel: FALLBACK_MODEL,
        promptLength: context.promptLength,
        messageCount: context.messageCount,
        error: reason,
      });
      const result = await runner(FALLBACK_MODEL);
      logInfo(this.logger, {
        requestId: context.requestId,
        event: 'llm.request.fallback_completed',
        module: OllamaService.name,
        status: 'succeeded',
        model: FALLBACK_MODEL,
        fallbackModel: FALLBACK_MODEL,
        promptLength: context.promptLength,
        messageCount: context.messageCount,
      });
      return result;
    }
  }

  async generateRaw(
    prompt: string,
    model?: string,
    context?: { requestId?: string; messageCount?: number },
  ): Promise<string> {
    return this.withModelFallback(
      model,
      {
        requestId: context?.requestId,
        promptLength: prompt.length,
        messageCount: context?.messageCount,
      },
      async (resolvedModel) => {
        const startedAt = Date.now();
        logInfo(this.logger, {
          requestId: context?.requestId,
          event: 'llm.request.started',
          module: OllamaService.name,
          status: 'started',
          model: resolvedModel,
          promptLength: prompt.length,
          messageCount: context?.messageCount,
        });
        try {
          const result = await this.post<{ response: string }>(
            '/api/generate',
            {
              model: resolvedModel,
              prompt,
              stream: false,
            },
            context?.requestId,
          );
          const response = (result?.response ?? '').trim();
          logInfo(this.logger, {
            requestId: context?.requestId,
            event: 'llm.request.completed',
            module: OllamaService.name,
            status: 'succeeded',
            model: resolvedModel,
            durationMs: Date.now() - startedAt,
            promptLength: prompt.length,
            messageCount: context?.messageCount,
            responseLength: response.length,
          });
          return response;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          logError(this.logger, {
            requestId: context?.requestId,
            event: 'llm.request.failed',
            module: OllamaService.name,
            status: 'failed',
            model: resolvedModel,
            durationMs: Date.now() - startedAt,
            promptLength: prompt.length,
            messageCount: context?.messageCount,
            error: message,
          });
          throw error;
        }
      },
    );
  }

  async generate(
    model: string,
    prompt: string,
    system?: string,
    context?: { requestId?: string; messageCount?: number },
  ): Promise<string> {
    const messages: OllamaChatMessage[] = [];
    if (system) messages.push({ role: 'system', content: system });
    messages.push({ role: 'user', content: prompt });
    const startedAt = Date.now();
    logInfo(this.logger, {
      requestId: context?.requestId,
      event: 'llm.request.started',
      module: OllamaService.name,
      status: 'started',
      model,
      promptLength: prompt.length,
      messageCount: messages.length,
    });
    try {
      const result = await this.post<{ message: { content: string } }>(
        '/api/chat',
        { model, messages, stream: false },
        context?.requestId,
      );
      const response = result.message?.content ?? '';
      logInfo(this.logger, {
        requestId: context?.requestId,
        event: 'llm.request.completed',
        module: OllamaService.name,
        status: 'succeeded',
        model,
        durationMs: Date.now() - startedAt,
        promptLength: prompt.length,
        messageCount: messages.length,
        responseLength: response.length,
      });
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logError(this.logger, {
        requestId: context?.requestId,
        event: 'llm.request.failed',
        module: OllamaService.name,
        status: 'failed',
        model,
        durationMs: Date.now() - startedAt,
        promptLength: prompt.length,
        messageCount: messages.length,
        error: message,
      });
      throw error;
    }
  }

  async generateInKoreanOnly(
    prompt: string,
    model?: string,
    context?: { requestId?: string; messageCount?: number },
  ): Promise<string> {
    return this.withModelFallback(
      model,
      {
        requestId: context?.requestId,
        promptLength: prompt.length,
        messageCount: context?.messageCount,
      },
      (resolvedModel) =>
        this.generate(resolvedModel, prompt, JAPANESE_STUDY_ASSISTANT_SYSTEM, context),
    );
  }

  private async *parseNdjsonStream(
    res: globalThis.Response,
  ): AsyncGenerator<string> {
    if (!res.body) throw new Error('No response body');
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const parsed = JSON.parse(line) as {
            message?: { content: string };
            done?: boolean;
          };
          if (parsed.message?.content) {
            yield parsed.message.content;
          }
          if (parsed.done) return;
        } catch {
          // 파싱 실패 무시
        }
      }
    }
  }

  async *streamChat(
    messages: OllamaChatMessage[],
    model?: string,
    context?: { requestId?: string; messageCount?: number },
  ): AsyncGenerator<string> {
    const resolvedModel = model || DEFAULT_MODEL;
    const startedAt = Date.now();
    logInfo(this.logger, {
      requestId: context?.requestId,
      event: 'llm.stream.started',
      module: OllamaService.name,
      status: 'started',
      model: resolvedModel,
      messageCount: context?.messageCount ?? messages.length,
    });
    try {
      const res = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: resolvedModel,
          messages: [
            { role: 'system', content: JAPANESE_STUDY_ASSISTANT_SYSTEM },
            ...messages,
          ],
          stream: true,
        }),
      });
      if (!res.ok) {
        logWarn(this.logger, {
          requestId: context?.requestId,
          event: 'llm.stream.failed',
          module: OllamaService.name,
          status: 'failed',
          model: resolvedModel,
          httpStatus: res.status,
          messageCount: context?.messageCount ?? messages.length,
          error: `Ollama stream failed: ${res.status}`,
        });
        throw new Error(`Ollama stream failed: ${res.status}`);
      }
      yield* this.parseNdjsonStream(res);
      logInfo(this.logger, {
        requestId: context?.requestId,
        event: 'llm.stream.completed',
        module: OllamaService.name,
        status: 'succeeded',
        model: resolvedModel,
        durationMs: Date.now() - startedAt,
        messageCount: context?.messageCount ?? messages.length,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logError(this.logger, {
        requestId: context?.requestId,
        event: 'llm.stream.failed',
        module: OllamaService.name,
        status: 'failed',
        model: resolvedModel,
        durationMs: Date.now() - startedAt,
        messageCount: context?.messageCount ?? messages.length,
        error: message,
      });
      throw error;
    }
  }

  async *streamChatWithImage(
    question: string,
    imageBase64: string,
    context?: { requestId?: string; messageCount?: number },
  ): AsyncGenerator<string> {
    const startedAt = Date.now();
    logInfo(this.logger, {
      requestId: context?.requestId,
      event: 'llm.image_stream.started',
      module: OllamaService.name,
      status: 'started',
      model: IMAGE_MODEL,
      promptLength: question.length,
      messageCount: context?.messageCount ?? 1,
    });
    try {
      const res = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: IMAGE_MODEL,
          messages: [
            { role: 'system', content: JAPANESE_STUDY_ASSISTANT_SYSTEM },
            {
              role: 'user',
              content: question || PromptBuilder.buildJapaneseReadingAnalysis(),
              images: [imageBase64],
            },
          ],
          stream: true,
        }),
      });
      if (!res.ok) {
        logWarn(this.logger, {
          requestId: context?.requestId,
          event: 'llm.image_stream.failed',
          module: OllamaService.name,
          status: 'failed',
          model: IMAGE_MODEL,
          httpStatus: res.status,
          messageCount: context?.messageCount ?? 1,
          error: `Ollama image stream failed: ${res.status}`,
        });
        throw new Error(`Ollama image stream failed: ${res.status}`);
      }
      yield* this.parseNdjsonStream(res);
      logInfo(this.logger, {
        requestId: context?.requestId,
        event: 'llm.image_stream.completed',
        module: OllamaService.name,
        status: 'succeeded',
        model: IMAGE_MODEL,
        durationMs: Date.now() - startedAt,
        promptLength: question.length,
        messageCount: context?.messageCount ?? 1,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logError(this.logger, {
        requestId: context?.requestId,
        event: 'llm.image_stream.failed',
        module: OllamaService.name,
        status: 'failed',
        model: IMAGE_MODEL,
        durationMs: Date.now() - startedAt,
        promptLength: question.length,
        messageCount: context?.messageCount ?? 1,
        error: message,
      });
      throw error;
    }
  }

  buildJapaneseWordExplanationPrompt(term: string): string {
    return PromptBuilder.buildJapaneseWordExplanation(term);
  }

  buildJapaneseGrammarExplanationPrompt(grammar: string, learnerSentence?: string): string {
    return PromptBuilder.buildJapaneseGrammarExplanation(grammar, learnerSentence);
  }

  buildJapaneseExampleGenerationPrompt(expression: string, level?: string): string {
    return PromptBuilder.buildJapaneseExampleGeneration(expression, level);
  }

  buildJapaneseCorrectionPrompt(learnerSentence: string, intendedMeaning?: string): string {
    return PromptBuilder.buildJapaneseCorrection(learnerSentence, intendedMeaning);
  }

  buildJapaneseRoleplayPrompt(situation: string, learnerLevel?: string): string {
    return PromptBuilder.buildJapaneseRoleplay(situation, learnerLevel);
  }
}
