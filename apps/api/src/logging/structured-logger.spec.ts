import { Logger } from '@nestjs/common';
import { logError, logInfo, logWarn } from './structured-logger';

describe('structured logger', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('writes a compact single-line JSON log entry', () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const logger = new Logger('TestLogger');

    logInfo(logger, {
      requestId: 'req-1',
      event: 'chat.request.started',
      module: 'ChatController',
      status: 'started',
      hasImage: false,
    });

    expect(logSpy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(String(logSpy.mock.calls[0][0])) as Record<string, unknown>;
    expect(payload.requestId).toBe('req-1');
    expect(payload.event).toBe('chat.request.started');
    expect(payload.module).toBe('ChatController');
    expect(payload.status).toBe('started');
    expect(payload.hasImage).toBe(false);
    expect(payload.timestamp).toEqual(expect.any(String));
  });

  it('routes warn and error logs through the matching nest logger methods', () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    const logger = new Logger('TestLogger');

    logWarn(logger, {
      event: 'llm.request.failed',
      module: 'OllamaService',
      status: 'failed',
      error: 'warn',
    });
    logError(logger, {
      event: 'chat.stream.failed',
      module: 'ChatService',
      status: 'failed',
      error: 'error',
    });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });
});
