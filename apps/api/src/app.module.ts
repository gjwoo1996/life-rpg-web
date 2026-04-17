import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OllamaModule } from './ollama/ollama.module';
import { ChatModule } from './chat/chat.module';
import { JlptModule } from './jlpt/jlpt.module';
import { ChatMessage, JlptAnalysis } from './entities';

const rootEnvPath = path.join(__dirname, '../../.env');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', rootEnvPath],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [ChatMessage, JlptAnalysis],
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
      inject: [ConfigService],
    }),
    OllamaModule,
    ChatModule,
    JlptModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
