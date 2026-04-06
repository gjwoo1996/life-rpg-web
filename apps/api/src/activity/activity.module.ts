import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLog } from '../entities/activity-log.entity';
import { OllamaModule } from '../ollama/ollama.module';
import { AbilityModule } from '../ability/ability.module';
import { GoalModule } from '../goal/goal.module';
import { AnalysisModule } from '../analysis/analysis.module';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ActivityLog]),
    OllamaModule,
    AbilityModule,
    GoalModule,
    AnalysisModule,
  ],
  controllers: [ActivityController],
  providers: [ActivityService],
  exports: [ActivityService],
})
export class ActivityModule {}
