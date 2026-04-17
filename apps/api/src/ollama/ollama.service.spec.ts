import { ConfigService } from '@nestjs/config';
import { OllamaService } from './ollama.service';

describe('OllamaService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('retries with fallback model when the default model request fails', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ response: 'fallback ok' }),
      });

    global.fetch = fetchMock as typeof fetch;

    const service = new OllamaService({
      get: jest.fn().mockReturnValue('http://ollama:11434'),
    } as unknown as ConfigService);

    const result = await service.generateRaw('테스트');

    expect(result).toBe('fallback ok');
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const firstBody = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    const secondBody = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));

    expect(firstBody.model).toBe('qwen3:8b');
    expect(secondBody.model).toBe('qwen2.5:7b');
  });

  it('does not fallback when an explicit model is requested', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
    });

    global.fetch = fetchMock as typeof fetch;

    const service = new OllamaService({
      get: jest.fn().mockReturnValue('http://ollama:11434'),
    } as unknown as ConfigService);

    await expect(service.generateRaw('테스트', 'gemma3:4b')).rejects.toThrow(
      'Ollama request failed: 500 Server Error',
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns installed chat models from ollama tags', async () => {
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        models: [
          { model: 'gemma3:4b' },
          { model: 'llava:7b' },
          { name: 'qwen3:8b' },
        ],
      }),
    });

    global.fetch = fetchMock as typeof fetch;

    const service = new OllamaService({
      get: jest.fn().mockReturnValue('http://ollama:11434'),
    } as unknown as ConfigService);

    await expect(service.getAvailableChatModels()).resolves.toEqual([
      { id: 'qwen3:8b', label: 'qwen3:8b', isDefault: true },
      { id: 'qwen2.5:7b', label: 'qwen2.5:7b', isDefault: false },
      { id: 'gemma3:4b', label: 'gemma3:4b', isDefault: false },
      { id: 'llava:7b', label: 'llava:7b', isDefault: false },
    ]);
  });

  it('falls back to configured models when tags lookup fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
    }) as typeof fetch;

    const service = new OllamaService({
      get: jest.fn().mockReturnValue('http://ollama:11434'),
    } as unknown as ConfigService);

    await expect(service.getAvailableChatModels()).resolves.toEqual([
      { id: 'qwen3:8b', label: 'qwen3:8b', isDefault: true },
      { id: 'qwen2.5:7b', label: 'qwen2.5:7b', isDefault: false },
    ]);
  });
});
