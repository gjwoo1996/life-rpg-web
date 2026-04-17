import { BadRequestException, Logger } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { JlptService } from './jlpt.service';
import type { JlptAnalysis } from '../entities/jlpt-analysis.entity';
import type { ChatMessage } from '../entities/chat-message.entity';
import type { OllamaService } from '../ollama/ollama.service';

describe('JlptService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('logs skipped when there are no messages to analyze', async () => {
    const jlptRepo = {
      find: jest.fn(),
      save: jest.fn(),
    } as unknown as Repository<JlptAnalysis>;
    const chatRepo = {
      find: jest.fn().mockResolvedValue([]),
    } as unknown as Repository<ChatMessage>;
    const ollama = {} as OllamaService;
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    const service = new JlptService(jlptRepo, chatRepo, ollama);

    await expect(
      service.analyze({ requestId: 'req-3', trigger: 'manual' }),
    ).rejects.toBeInstanceOf(BadRequestException);

    const events = warnSpy.mock.calls.map(([message]) => JSON.parse(String(message)).event);
    expect(events).toContain('jlpt.analysis.failed');
    const payload = JSON.parse(String(warnSpy.mock.calls[0][0])) as Record<string, unknown>;
    expect(payload.status).toBe('skipped');
  });

  it('logs parse failures without dumping the full response', async () => {
    const jlptRepo = {
      find: jest.fn(),
      save: jest.fn(),
    } as unknown as Repository<JlptAnalysis>;
    const chatRepo = {
      find: jest.fn().mockResolvedValue([{ content: '안녕하세요', role: 'user' }]),
    } as unknown as Repository<ChatMessage>;
    const ollama = {
      generateRaw: jest.fn().mockResolvedValue('not-json'),
    } as unknown as OllamaService;
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    const service = new JlptService(jlptRepo, chatRepo, ollama);

    await expect(
      service.analyze({ requestId: 'req-4', trigger: 'manual' }),
    ).rejects.toThrow('JLPT 분석 결과를 파싱할 수 없습니다.');

    const payload = errorSpy.mock.calls
      .map(([message]) => JSON.parse(String(message)) as Record<string, unknown>)
      .find((entry) => entry.event === 'jlpt.analysis.parse_failed');

    expect(payload).toBeDefined();
    expect(payload?.responseLength).toBe(8);
    expect(payload?.preview).toBe('not-json');
  });

  it('logs saved and completed events after a successful analysis', async () => {
    const savedAnalysis = { id: 'analysis-1' } as JlptAnalysis;
    const jlptRepo = {
      find: jest.fn(),
      save: jest.fn().mockResolvedValue(savedAnalysis),
    } as unknown as Repository<JlptAnalysis>;
    const chatRepo = {
      find: jest.fn().mockResolvedValue([{ content: '테스트', role: 'user' }]),
    } as unknown as Repository<ChatMessage>;
    const ollama = {
      generateRaw: jest.fn().mockResolvedValue(
        JSON.stringify({
          level: 'N3',
          vocabularyScore: 10,
          grammarScore: 20,
          readingScore: 30,
          totalScore: 60,
        }),
      ),
    } as unknown as OllamaService;
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

    const service = new JlptService(jlptRepo, chatRepo, ollama);
    const result = await service.analyze({ requestId: 'req-5', trigger: 'manual' });

    expect(result).toBe(savedAnalysis);
    const events = logSpy.mock.calls.map(([message]) => JSON.parse(String(message)).event);
    expect(events).toEqual(
      expect.arrayContaining(['jlpt.analysis.saved', 'jlpt.analysis.completed']),
    );
  });
});
