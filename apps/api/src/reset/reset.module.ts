import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Character,
  Goal,
  ActivityLog,
  Ability,
  AbilityStat,
  DailyAnalysis,
  GoalAnalysis,
} from '../entities';
import { ResetController } from './reset.controller';
import { ResetService } from './reset.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GoalAnalysis,
      DailyAnalysis,
      AbilityStat,
      Ability,
      ActivityLog,
      Goal,
      Character,
    ]),
  ],
  controllers: [ResetController],
  providers: [ResetService],
})
export class ResetModule {}
