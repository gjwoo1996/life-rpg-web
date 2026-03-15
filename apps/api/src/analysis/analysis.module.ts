import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLog } from '../entities/activity-log.entity';
import { DailyAnalysis } from '../entities/daily-analysis.entity';
import { Goal } from '../entities/goal.entity';
import { GoalAnalysis } from '../entities/goal-analysis.entity';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([DailyAnalysis, GoalAnalysis, ActivityLog, Goal]),
  ],
  controllers: [AnalysisController],
  providers: [AnalysisService],
  exports: [AnalysisService],
})
export class AnalysisModule {}
