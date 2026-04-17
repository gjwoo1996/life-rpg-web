import { Logger } from '@nestjs/common';

export interface LogContext {
  requestId?: string;
  event: string;
  module: string;
  status: string;
  durationMs?: number;
  model?: string;
  messageCount?: number;
  error?: string;
  hasImage?: boolean;
  promptLength?: number;
  responseLength?: number;
  httpStatus?: number;
  fallbackModel?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  analysisTrigger?: string;
  preview?: string;
  historyCount?: number;
}

function compactContext(context: LogContext): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries({
      timestamp: new Date().toISOString(),
      ...context,
    }).filter(([, value]) => value !== undefined),
  ) as Record<string, string | number | boolean>;
}

function writeLog(
  logger: Logger,
  level: 'log' | 'warn' | 'error',
  context: LogContext,
): void {
  logger[level](JSON.stringify(compactContext(context)));
}

export function logInfo(logger: Logger, context: LogContext): void {
  writeLog(logger, 'log', context);
}

export function logWarn(logger: Logger, context: LogContext): void {
  writeLog(logger, 'warn', context);
}

export function logError(logger: Logger, context: LogContext): void {
  writeLog(logger, 'error', context);
}
