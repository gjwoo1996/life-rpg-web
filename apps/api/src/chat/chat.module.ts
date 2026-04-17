import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatMessage } from '../entities/chat-message.entity';
import { OllamaModule } from '../ollama/ollama.module';
import { JlptModule } from '../jlpt/jlpt.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatMessage]),
    OllamaModule,
    forwardRef(() => JlptModule),
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}
