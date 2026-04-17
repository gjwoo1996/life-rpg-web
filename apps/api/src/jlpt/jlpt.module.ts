import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JlptController } from './jlpt.controller';
import { JlptService } from './jlpt.service';
import { JlptAnalysis } from '../entities/jlpt-analysis.entity';
import { ChatMessage } from '../entities/chat-message.entity';
import { OllamaModule } from '../ollama/ollama.module';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([JlptAnalysis, ChatMessage]),
    OllamaModule,
    forwardRef(() => ChatModule),
  ],
  controllers: [JlptController],
  providers: [JlptService],
  exports: [JlptService],
})
export class JlptModule {}
