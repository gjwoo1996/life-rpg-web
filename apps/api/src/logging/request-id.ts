import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';

export const REQUEST_ID_HEADER = 'x-request-id';

export interface RequestWithId extends Request {
  requestId: string;
}

export function normalizeRequestId(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return normalizeRequestId(value[0]);
  }
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolveRequestId(headerValue: string | string[] | undefined): string {
  return normalizeRequestId(headerValue) ?? randomUUID();
}

export function attachRequestId(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const requestId = resolveRequestId(req.headers[REQUEST_ID_HEADER]);
  const requestWithId = req as RequestWithId;
  requestWithId.requestId = requestId;
  res.setHeader(REQUEST_ID_HEADER, requestId);
  next();
}
