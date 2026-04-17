import { Logger } from '@nestjs/common';
import type * as express from 'express';
import type { Repository } from 'typeorm';
import { ChatService } from './chat.service';
import type { ChatMessage } from '../entities/chat-message.entity';
import type { JlptService } from '../jlpt/jlpt.service';
import type { OllamaService } from '../ollama/ollama.service';

function createStream(chunks: string[]): AsyncGenerator<string> {
  async function* generator() {
    for (const chunk of chunks) {
      yield chunk;
    }
  }

  return generator();
}

describe('ChatService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs the normal chat flow and triggers JLPT analysis on the 10th user message', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const find = jest.fn().mockResolvedValue([
      { role: 'user', content: '안녕' },
      { role: 'assistant', content: '반가워' },
    ]);
    const count = jest.fn().mockResolvedValue(10);
    const chatRepo = { save, find, count } as unknown as Repository<ChatMessage>;
    const ollama = {
      streamChat: jest.fn().mockReturnValue(createStream(['테', '스트'])),
    } as unknown as OllamaService;
    const jlptService = {
      analyze: jest.fn().mockResolvedValue(undefined),
    } as unknown as JlptService;
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

    const service = new ChatService(chatRepo, ollama, jlptService);
    const res = {
      write: jest.fn(),
      end: jest.fn(),
      on: jest.fn(),
      statusCode: 200,
    } as unknown as express.Response;

    await service.streamResponse('메시지', res, {
      requestId: 'req-1',
      method: 'POST',
      path: '/chat',
    });

    expect(save).toHaveBeenCalledTimes(2);
    expect(ollama.streamChat).toHaveBeenCalledWith(expect.any(Array), undefined, {
      requestId: 'req-1',
      messageCount: 2,
    });
    expect(jlptService.analyze).toHaveBeenCalledWith({
      requestId: 'req-1',
      trigger: 'auto',
    });

    const events = logSpy.mock.calls.map(([message]) => JSON.parse(String(message)).event);
    expect(events).toEqual(
      expect.arrayContaining([
        'chat.message.user_saved',
        'chat.stream.started',
        'chat.stream.completed',
        'chat.message.assistant_saved',
        'jlpt.analysis.triggered',
      ]),
    );
  });

  it('logs a failed stream and still writes an SSE error payload', async () => {
    const chatRepo = {
      save: jest.fn().mockResolvedValue(undefined),
      find: jest.fn().mockResolvedValue([{ role: 'user', content: '안녕' }]),
      count: jest.fn().mockResolvedValue(1),
    } as unknown as Repository<ChatMessage>;
    const ollama = {
      streamChat: jest.fn().mockImplementation(async function* () {
        throw new Error('stream broke');
      }),
    } as unknown as OllamaService;
    const jlptService = {
      analyze: jest.fn(),
    } as unknown as JlptService;
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    const service = new ChatService(chatRepo, ollama, jlptService);
    const res = {
      write: jest.fn(),
      end: jest.fn(),
      on: jest.fn(),
      statusCode: 200,
    } as unknown as express.Response;

    await service.streamResponse('메시지', res, { requestId: 'req-2' });

    expect(res.write).toHaveBeenCalledWith(
      expect.stringContaining('"error":"stream broke"'),
    );
    const events = errorSpy.mock.calls.map(([message]) => JSON.parse(String(message)).event);
    expect(events).toContain('chat.stream.failed');
  });
});
