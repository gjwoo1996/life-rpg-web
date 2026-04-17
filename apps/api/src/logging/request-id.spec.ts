import type { NextFunction, Request, Response } from 'express';
import {
  REQUEST_ID_HEADER,
  attachRequestId,
  normalizeRequestId,
  resolveRequestId,
} from './request-id';

describe('request-id helpers', () => {
  it('uses a normalized incoming request id when the header is present', () => {
    expect(resolveRequestId('  req-123  ')).toBe('req-123');
  });

  it('generates a request id when the header is missing', () => {
    expect(resolveRequestId(undefined)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('returns null for blank values', () => {
    expect(normalizeRequestId('   ')).toBeNull();
  });

  it('attaches the request id to the request and response', () => {
    const req = {
      headers: {
        [REQUEST_ID_HEADER]: 'req-abc',
      },
    } as unknown as Request;
    const setHeader = jest.fn();
    const res = {
      setHeader,
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    attachRequestId(req, res, next);

    expect((req as Request & { requestId: string }).requestId).toBe('req-abc');
    expect(setHeader).toHaveBeenCalledWith(REQUEST_ID_HEADER, 'req-abc');
    expect(next).toHaveBeenCalled();
  });
});
