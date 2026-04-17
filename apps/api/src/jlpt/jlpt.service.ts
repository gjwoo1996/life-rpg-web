import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JlptAnalysis } from '../entities/jlpt-analysis.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { OllamaService } from '../ollama/ollama.service';
import { PromptBuilder } from '../ollama/prompt-builder';
import { logError, logInfo, logWarn } from '../logging/structured-logger';

interface AnalyzeOptions {
  requestId?: string;
  trigger: 'manual' | 'auto';
}

@Injectable()
export class JlptService {
  private readonly logger = new Logger(JlptService.name);

  constructor(
    @InjectRepository(JlptAnalysis)
    private readonly jlptRepo: Repository<JlptAnalysis>,
    @InjectRepository(ChatMessage)
    private readonly chatRepo: Repository<ChatMessage>,
    private readonly ollama: OllamaService,
  ) {}

  async getLatest(): Promise<JlptAnalysis | null> {
    const results = await this.jlptRepo.find({
      order: { analyzedAt: 'DESC' },
      take: 1,
    });
    return results[0] ?? null;
  }

  async analyze(options: AnalyzeOptions = { trigger: 'manual' }): Promise<JlptAnalysis> {
    const startedAt = Date.now();
    const messages = await this.chatRepo.find({
      where: { role: 'user' },
      order: { createdAt: 'ASC' },
    });

    logInfo(this.logger, {
      requestId: options.requestId,
      event: 'jlpt.analysis.started',
      module: JlptService.name,
      status: 'started',
      analysisTrigger: options.trigger,
      messageCount: messages.length,
    });

    if (messages.length === 0) {
      logWarn(this.logger, {
        requestId: options.requestId,
        event: 'jlpt.analysis.failed',
        module: JlptService.name,
        status: 'skipped',
        analysisTrigger: options.trigger,
        messageCount: 0,
        error: '분석할 메시지가 없습니다.',
      });
      throw new BadRequestException('분석할 메시지가 없습니다.');
    }

    const userMessagesText = messages.map((m) => m.content).join('\n---\n');
    const prompt = PromptBuilder.buildJlptAnalysis(userMessagesText);

    const raw = await this.ollama.generateRaw(prompt, undefined, {
      requestId: options.requestId,
      messageCount: messages.length,
    });
    const jsonStr = raw
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    let parsed: {
      level: string;
      vocabularyScore: number;
      grammarScore: number;
      readingScore: number;
      totalScore: number;
      detail?: string;
    };

    try {
      parsed = JSON.parse(jsonStr) as typeof parsed;
    } catch (error) {
      logError(this.logger, {
        requestId: options.requestId,
        event: 'jlpt.analysis.parse_failed',
        module: JlptService.name,
        status: 'failed',
        analysisTrigger: options.trigger,
        durationMs: Date.now() - startedAt,
        messageCount: messages.length,
        promptLength: prompt.length,
        responseLength: raw.length,
        preview: raw.slice(0, 200),
        error: error instanceof Error ? error.message : 'JSON parse error',
      });
      throw new Error('JLPT 분석 결과를 파싱할 수 없습니다.');
    }

    const saved = await this.jlptRepo.save({
      level: parsed.level as JlptAnalysis['level'],
      vocabularyScore: parsed.vocabularyScore,
      grammarScore: parsed.grammarScore,
      readingScore: parsed.readingScore,
      totalScore: parsed.totalScore,
      messageCount: messages.length,
      analysisDetail: parsed.detail ?? null,
    });

    logInfo(this.logger, {
      requestId: options.requestId,
      event: 'jlpt.analysis.saved',
      module: JlptService.name,
      status: 'succeeded',
      analysisTrigger: options.trigger,
      messageCount: messages.length,
    });
    logInfo(this.logger, {
      requestId: options.requestId,
      event: 'jlpt.analysis.completed',
      module: JlptService.name,
      status: 'succeeded',
      analysisTrigger: options.trigger,
      durationMs: Date.now() - startedAt,
      messageCount: messages.length,
      responseLength: raw.length,
    });

    return saved;
  }
}
