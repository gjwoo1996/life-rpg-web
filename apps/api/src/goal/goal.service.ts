import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Goal } from '../entities/goal.entity';
import { AbilityService } from '../ability/ability.service';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

@Injectable()
export class GoalService {
  constructor(
    @InjectRepository(Goal)
    private readonly repo: Repository<Goal>,
    private readonly abilityService: AbilityService,
  ) {}

  async create(dto: CreateGoalDto) {
    await this.abilityService.ensureAbility(dto.characterId, dto.targetSkill);
    const goal = this.repo.create({
      ...dto,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      calendarColor: dto.calendarColor ?? '#6366f1',
    });
    return this.repo.save(goal);
  }

  findAll() {
    return this.repo.find({
      order: { createdAt: 'DESC' },
      relations: ['character'],
    });
  }

  findByCharacter(characterId: string) {
    return this.repo.find({
      where: { characterId },
      order: { createdAt: 'DESC' },
    });
  }

  /** Goals where date is within [startDate, endDate] (life-rpg list_goals_for_date). */
  async listGoalsForDate(characterId: string, date: string) {
    return this.repo
      .createQueryBuilder('goal')
      .where('goal.characterId = :characterId', { characterId })
      .andWhere('goal.startDate <= :date', { date })
      .andWhere('goal.endDate >= :date', { date })
      .orderBy('goal.id', 'DESC')
      .getMany();
  }

  async findOne(id: string) {
    const goal = await this.repo.findOne({
      where: { id },
      relations: ['character', 'goalAnalyses'],
    });
    if (!goal) throw new NotFoundException('Goal not found');
    return goal;
  }

  async update(id: string, dto: UpdateGoalDto) {
    const { startDate, endDate, ...rest } = dto;
    const patch: Partial<Goal> = {
      ...rest,
      ...(startDate && { startDate: new Date(startDate) }),
      ...(endDate && { endDate: new Date(endDate) }),
    };
    await this.repo.update(id, patch);
    return this.findOne(id);
  }

  remove(id: string) {
    return this.repo.delete(id);
  }
}
