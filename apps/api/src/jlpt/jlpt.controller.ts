import {
  Controller,
  Get,
  HttpException,
  Logger,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { JlptService } from './jlpt.service';
import type { RequestWithId } from '../logging/request-id';
import { logError, logInfo } from '../logging/structured-logger';

@Controller('jlpt')
export class JlptController {
  private readonly logger = new Logger(JlptController.name);

  constructor(private readonly jlptService: JlptService) {}

  @Get()
  getLatest() {
    return this.jlptService.getLatest();
  }

  @Post('analyze')
  async analyze(
    @Req() req: RequestWithId,
    @Res({ passthrough: true }) res: Response,
  ) {
    const startedAt = Date.now();
    logInfo(this.logger, {
      requestId: req.requestId,
      event: 'jlpt.request.started',
      module: JlptController.name,
      status: 'started',
      method: req.method,
      path: req.path,
    });

    try {
      const result = await this.jlptService.analyze({
        requestId: req.requestId,
        trigger: 'manual',
      });
      logInfo(this.logger, {
        requestId: req.requestId,
        event: 'jlpt.request.completed',
        module: JlptController.name,
        status: 'succeeded',
        method: req.method,
        path: req.path,
        durationMs: Date.now() - startedAt,
        statusCode: res.statusCode,
      });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logError(this.logger, {
        requestId: req.requestId,
        event: 'jlpt.request.failed',
        module: JlptController.name,
        status: 'failed',
        method: req.method,
        path: req.path,
        durationMs: Date.now() - startedAt,
        error: message,
        statusCode: error instanceof HttpException ? error.getStatus() : undefined,
      });
      throw error;
    }
  }
}
