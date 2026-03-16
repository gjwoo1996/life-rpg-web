import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as path from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OllamaModule } from './ollama/ollama.module';
import { CharacterModule } from './character/character.module';
import { GoalModule } from './goal/goal.module';
import { GoalStepModule } from './goal-step/goal-step.module';
import { ActivityModule } from './activity/activity.module';
import { AbilityModule } from './ability/ability.module';
import { AnalysisModule } from './analysis/analysis.module';
import { ResetModule } from './reset/reset.module';
import {
  Character,
  Goal,
  ActivityLog,
  Ability,
  AbilityStat,
  DailyAnalysis,
  GoalAnalysis,
  GoalStep,
} from './entities';

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
        entities: [
          Character,
          Goal,
          ActivityLog,
          Ability,
          AbilityStat,
          DailyAnalysis,
          GoalAnalysis,
          GoalStep,
        ],
        synchronize: config.get('NODE_ENV') !== 'production',
      }),
      inject: [ConfigService],
    }),
    OllamaModule,
    CharacterModule,
    GoalModule,
    GoalStepModule,
    ActivityModule,
    AbilityModule,
    AnalysisModule,
    ResetModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
