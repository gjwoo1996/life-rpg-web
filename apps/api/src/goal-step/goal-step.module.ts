import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GoalStep } from '../entities/goal-step.entity';
import { Goal } from '../entities/goal.entity';
import { GoalStepService } from './goal-step.service';
import { GoalStepController } from './goal-step.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GoalStep, Goal])],
  controllers: [GoalStepController],
  providers: [GoalStepService],
  exports: [GoalStepService],
})
export class GoalStepModule {}
