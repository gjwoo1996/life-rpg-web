import { Injectable, forwardRef, Inject, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as express from 'express';
import { ChatMessage } from '../entities/chat-message.entity';
import {
  OllamaService,
  OllamaChatMessage,
  OllamaModelOption,
} from '../ollama/ollama.service';
import { JlptService } from '../jlpt/jlpt.service';
import { logError, logInfo, logWarn } from '../logging/structured-logger';
import { PromptBuilder } from '../ollama/prompt-builder';

interface ChatRequestLogContext {
  requestId: string;
  method?: string;
  path?: string;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatRepo: Repository<ChatMessage>,
    private readonly ollama: OllamaService,
    @Inject(forwardRef(() => JlptService))
    private readonly jlptService: JlptService,
  ) {}

  async streamResponse(
    message: string,
    model: string | undefined,
    res: express.Response,
    context: ChatRequestLogContext,
  ): Promise<void> {
    const requestStartedAt = Date.now();
    let streamClosedByClient = true;
    res.on('close', () => {
      if (streamClosedByClient) {
        logWarn(this.logger, {
          requestId: context.requestId,
          event: 'chat.stream.client_disconnected',
          module: ChatService.name,
          status: 'failed',
          hasImage: false,
          durationMs: Date.now() - requestStartedAt,
          method: context.method,
          path: context.path,
        });
      }
    });

    await this.chatRepo.save({ role: 'user', content: message, hasImage: false });
    logInfo(this.logger, {
      requestId: context.requestId,
      event: 'chat.message.user_saved',
      module: ChatService.name,
      status: 'succeeded',
      hasImage: false,
    });

    const history = await this.chatRepo.find({
      order: { createdAt: 'DESC' },
      take: 20,
    });
    const ollamaMessages: OllamaChatMessage[] = history
      .reverse()
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    let fullContent = '';
    const streamStartedAt = Date.now();
    logInfo(this.logger, {
      requestId: context.requestId,
      event: 'chat.stream.started',
      module: ChatService.name,
      status: 'started',
      hasImage: false,
      historyCount: history.length,
      messageCount: ollamaMessages.length,
    });

    try {
      for await (const chunk of this.ollama.streamChat(ollamaMessages, model, {
        requestId: context.requestId,
        messageCount: ollamaMessages.length,
      })) {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        fullContent += chunk;
      }
      logInfo(this.logger, {
        requestId: context.requestId,
        event: 'chat.stream.completed',
        module: ChatService.name,
        status: 'succeeded',
        hasImage: false,
        durationMs: Date.now() - streamStartedAt,
        responseLength: fullContent.length,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'LLM error';
      logError(this.logger, {
        requestId: context.requestId,
        event: 'chat.stream.failed',
        module: ChatService.name,
        status: 'failed',
        hasImage: false,
        durationMs: Date.now() - streamStartedAt,
        error: msg,
      });
      res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
    }

    if (fullContent) {
      await this.chatRepo.save({ role: 'assistant', content: fullContent, hasImage: false });
      logInfo(this.logger, {
        requestId: context.requestId,
        event: 'chat.message.assistant_saved',
        module: ChatService.name,
        status: 'succeeded',
        hasImage: false,
        responseLength: fullContent.length,
      });
    }

    const count = await this.chatRepo.count({ where: { role: 'user' } });
    if (count > 0 && count % 10 === 0) {
      logInfo(this.logger, {
        requestId: context.requestId,
        event: 'jlpt.analysis.triggered',
        module: ChatService.name,
        status: 'started',
        analysisTrigger: 'auto',
        messageCount: count,
      });
      this.jlptService
        .analyze({
          requestId: context.requestId,
          trigger: 'auto',
        })
        .catch((error) => {
          const message = error instanceof Error ? error.message : String(error);
          logError(this.logger, {
            requestId: context.requestId,
            event: 'jlpt.analysis.failed',
            module: ChatService.name,
            status: 'failed',
            analysisTrigger: 'auto',
            messageCount: count,
            error: message,
          });
        });
    }

    res.write('data: [DONE]\n\n');
    streamClosedByClient = false;
    res.end();
  }

  async streamImageResponse(
    question: string,
    imageBase64: string,
    res: express.Response,
    context: ChatRequestLogContext,
  ): Promise<void> {
    const userContent = question || PromptBuilder.buildJapaneseReadingAnalysis();
    const requestStartedAt = Date.now();
    let streamClosedByClient = true;
    res.on('close', () => {
      if (streamClosedByClient) {
        logWarn(this.logger, {
          requestId: context.requestId,
          event: 'chat.stream.client_disconnected',
          module: ChatService.name,
          status: 'failed',
          hasImage: true,
          durationMs: Date.now() - requestStartedAt,
          method: context.method,
          path: context.path,
        });
      }
    });

    await this.chatRepo.save({ role: 'user', content: userContent, hasImage: true });
    logInfo(this.logger, {
      requestId: context.requestId,
      event: 'chat.message.user_saved',
      module: ChatService.name,
      status: 'succeeded',
      hasImage: true,
    });

    let fullContent = '';
    const streamStartedAt = Date.now();
    logInfo(this.logger, {
      requestId: context.requestId,
      event: 'chat.stream.started',
      module: ChatService.name,
      status: 'started',
      hasImage: true,
      messageCount: 1,
    });
    try {
      for await (const chunk of this.ollama.streamChatWithImage(userContent, imageBase64, {
        requestId: context.requestId,
        messageCount: 1,
      })) {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        fullContent += chunk;
      }
      logInfo(this.logger, {
        requestId: context.requestId,
        event: 'chat.stream.completed',
        module: ChatService.name,
        status: 'succeeded',
        hasImage: true,
        durationMs: Date.now() - streamStartedAt,
        responseLength: fullContent.length,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'LLM error';
      logError(this.logger, {
        requestId: context.requestId,
        event: 'chat.stream.failed',
        module: ChatService.name,
        status: 'failed',
        hasImage: true,
        durationMs: Date.now() - streamStartedAt,
        error: msg,
      });
      res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
    }

    if (fullContent) {
      await this.chatRepo.save({ role: 'assistant', content: fullContent, hasImage: false });
      logInfo(this.logger, {
        requestId: context.requestId,
        event: 'chat.message.assistant_saved',
        module: ChatService.name,
        status: 'succeeded',
        hasImage: true,
        responseLength: fullContent.length,
      });
    }

    const count = await this.chatRepo.count({ where: { role: 'user' } });
    if (count > 0 && count % 10 === 0) {
      logInfo(this.logger, {
        requestId: context.requestId,
        event: 'jlpt.analysis.triggered',
        module: ChatService.name,
        status: 'started',
        analysisTrigger: 'auto',
        messageCount: count,
      });
      this.jlptService
        .analyze({
          requestId: context.requestId,
          trigger: 'auto',
        })
        .catch((error) => {
          const message = error instanceof Error ? error.message : String(error);
          logError(this.logger, {
            requestId: context.requestId,
            event: 'jlpt.analysis.failed',
            module: ChatService.name,
            status: 'failed',
            analysisTrigger: 'auto',
            messageCount: count,
            error: message,
          });
        });
    }

    res.write('data: [DONE]\n\n');
    streamClosedByClient = false;
    res.end();
  }

  getHistory(limit = 100): Promise<ChatMessage[]> {
    return this.chatRepo.find({
      order: { createdAt: 'ASC' },
      take: limit,
    });
  }

  getAvailableModels(): Promise<OllamaModelOption[]> {
    return this.ollama.getAvailableChatModels();
  }

  async clearHistory(): Promise<{ ok: boolean }> {
    await this.chatRepo.clear();
    return { ok: true };
  }
}
