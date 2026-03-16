import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GoalStep } from '../entities/goal-step.entity';
import { Goal } from '../entities/goal.entity';
import { CreateGoalStepDto } from './dto/create-goal-step.dto';
import { UpdateGoalStepDto } from './dto/update-goal-step.dto';

@Injectable()
export class GoalStepService {
  constructor(
    @InjectRepository(GoalStep)
    private readonly repo: Repository<GoalStep>,
    @InjectRepository(Goal)
    private readonly goalRepo: Repository<Goal>,
  ) {}

  private ensureWithinGoalRange(
    goal: Goal,
    startDate: Date | null,
    endDate: Date | null,
  ) {
    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException('Step startDate must be before or equal to endDate');
    }

    if (!goal.startDate && !goal.endDate) return;

    const goalStart = goal.startDate ?? null;
    const goalEnd = goal.endDate ?? null;

    const check = (d: Date | null) => {
      if (!d) return;
      if (goalStart && d < goalStart) {
        throw new BadRequestException('Step date must be within goal startDate');
      }
      if (goalEnd && d > goalEnd) {
        throw new BadRequestException('Step date must be within goal endDate');
      }
    };

    check(startDate);
    check(endDate);
  }

  async create(dto: CreateGoalStepDto) {
    const goal = await this.goalRepo.findOne({ where: { id: dto.goalId } });
    if (!goal) throw new NotFoundException('Goal not found');

    const startDate = dto.startDate ? new Date(dto.startDate) : null;
    const endDate = dto.endDate ? new Date(dto.endDate) : null;

    this.ensureWithinGoalRange(goal, startDate, endDate);

    const step = this.repo.create({
      ...dto,
      startDate,
      endDate,
      order: dto.order ?? 0,
    });
    return this.repo.save(step);
  }

  findByGoal(goalId: string) {
    return this.repo.find({
      where: { goalId },
      order: { order: 'ASC', startDate: 'ASC', createdAt: 'ASC' },
    });
  }

  async update(id: string, dto: UpdateGoalStepDto) {
    const existing = await this.repo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException('GoalStep not found');
    const goal = await this.goalRepo.findOne({ where: { id: existing.goalId } });
    if (!goal) throw new NotFoundException('Goal not found');

    const { startDate, endDate, ...rest } = dto;

    const nextStartDate =
      startDate !== undefined ? (startDate ? new Date(startDate) : null) : existing.startDate;
    const nextEndDate =
      endDate !== undefined ? (endDate ? new Date(endDate) : null) : existing.endDate;

    this.ensureWithinGoalRange(goal, nextStartDate, nextEndDate);

    const patch: Partial<GoalStep> = {
      ...rest,
      ...(startDate !== undefined && {
        startDate: startDate ? new Date(startDate) : null,
      }),
      ...(endDate !== undefined && {
        endDate: endDate ? new Date(endDate) : null,
      }),
    };
    await this.repo.update(id, patch);
    return this.repo.findOne({ where: { id } });
  }

  remove(id: string) {
    return this.repo.delete(id);
  }
}
