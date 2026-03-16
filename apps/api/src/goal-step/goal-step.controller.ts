import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { GoalStepService } from './goal-step.service';
import { CreateGoalStepDto } from './dto/create-goal-step.dto';
import { UpdateGoalStepDto } from './dto/update-goal-step.dto';

@Controller('goal-step')
export class GoalStepController {
  constructor(private readonly service: GoalStepService) {}

  @Post()
  create(@Body() dto: CreateGoalStepDto) {
    return this.service.create(dto);
  }

  @Get()
  listByGoal(@Query('goalId') goalId: string) {
    if (!goalId) return [];
    return this.service.findByGoal(goalId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGoalStepDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
