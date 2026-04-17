import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  Res,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import * as express from 'express';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import type { RequestWithId } from '../logging/request-id';
import { logError, logInfo } from '../logging/structured-logger';

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  @Post()
  async sendMessage(
    @Body() dto: SendMessageDto,
    @Req() req: RequestWithId,
    @Res() res: express.Response,
  ): Promise<void> {
    const startedAt = Date.now();
    logInfo(this.logger, {
      requestId: req.requestId,
      event: 'chat.request.started',
      module: ChatController.name,
      status: 'started',
      method: req.method,
      path: req.path,
      hasImage: false,
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    try {
      await this.chatService.streamResponse(dto.message, res, {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
      });
      logInfo(this.logger, {
        requestId: req.requestId,
        event: 'chat.request.completed',
        module: ChatController.name,
        status: 'succeeded',
        method: req.method,
        path: req.path,
        hasImage: false,
        durationMs: Date.now() - startedAt,
        statusCode: res.statusCode,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logError(this.logger, {
        requestId: req.requestId,
        event: 'chat.request.failed',
        module: ChatController.name,
        status: 'failed',
        method: req.method,
        path: req.path,
        hasImage: false,
        durationMs: Date.now() - startedAt,
        error: message,
      });
      throw error;
    }
  }

  @Post('image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('이미지 파일만 허용됩니다.'), false);
        }
        cb(null, true);
      },
    }),
  )
  async sendImageMessage(
    @UploadedFile() file: Express.Multer.File,
    @Body('question') question: string,
    @Req() req: RequestWithId,
    @Res() res: express.Response,
  ): Promise<void> {
    if (!file) throw new BadRequestException('이미지가 필요합니다.');

    const base64 = file.buffer.toString('base64');
    const startedAt = Date.now();

    logInfo(this.logger, {
      requestId: req.requestId,
      event: 'chat.image.request.started',
      module: ChatController.name,
      status: 'started',
      method: req.method,
      path: req.path,
      hasImage: true,
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders();

    try {
      await this.chatService.streamImageResponse(question, base64, res, {
        requestId: req.requestId,
        method: req.method,
        path: req.path,
      });
      logInfo(this.logger, {
        requestId: req.requestId,
        event: 'chat.image.request.completed',
        module: ChatController.name,
        status: 'succeeded',
        method: req.method,
        path: req.path,
        hasImage: true,
        durationMs: Date.now() - startedAt,
        statusCode: res.statusCode,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logError(this.logger, {
        requestId: req.requestId,
        event: 'chat.request.failed',
        module: ChatController.name,
        status: 'failed',
        method: req.method,
        path: req.path,
        hasImage: true,
        durationMs: Date.now() - startedAt,
        error: message,
      });
      throw error;
    }
  }

  @Get('history')
  getHistory(@Query('limit') limit?: string) {
    return this.chatService.getHistory(limit ? parseInt(limit, 10) : 100);
  }

  @Delete('history')
  clearHistory() {
    return this.chatService.clearHistory();
  }
}
