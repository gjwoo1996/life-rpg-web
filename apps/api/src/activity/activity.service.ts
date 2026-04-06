import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { ActivityLog } from '../entities/activity-log.entity';
import { Ability } from '../entities/ability.entity';
import { AbilityStat } from '../entities/ability-stat.entity';
import { Character } from '../entities/character.entity';
import { OllamaService } from '../ollama/ollama.service';
import { AbilityService } from '../ability/ability.service';
import { GoalService } from '../goal/goal.service';
import { AnalysisService } from '../analysis/analysis.service';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';

@Injectable()
export class ActivityService {
  private static readonly MAX_ABILITY_XP = 100;

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(ActivityLog)
    private readonly repo: Repository<ActivityLog>,
    private readonly ollama: OllamaService,
    private readonly abilityService: AbilityService,
    private readonly goalService: GoalService,
    private readonly analysisService: AnalysisService,
  ) {}

  /** Create activity with LLM summary, XP analysis, ability/character XP update, and daily/goal analysis refresh. */
  async create(dto: CreateActivityLogDto) {
    const content = dto.content?.trim() ?? '';
    if (!content) throw new BadRequestException('Content cannot be empty');

    const abilityStats = await this.abilityService.getStats(dto.characterId);
    const abilityNames = abilityStats.map((s) => s.name);
    if (abilityNames.length === 0) {
      throw new BadRequestException(
        'Add at least one goal with an ability before logging activities',
      );
    }

    let summary = '';
    try {
      summary = await this.ollama.summarizeContent(content);
    } catch {
      summary = '';
    }

    let xpMap: Record<string, number> = {};
    try {
      xpMap = await this.ollama.analyzeActivityXp(content, abilityNames);
    } catch {
      xpMap = {};
    }
    const xpGained = Object.values(xpMap).reduce((a, b) => a + b, 0);

    const log = await this.dataSource.transaction(async (manager) => {
      for (const [name, xp] of Object.entries(xpMap)) {
        if (xp > 0) await this.applyAbilityXp(manager, dto.characterId, name, xp);
      }
      await this.applyCharacterXp(manager, dto.characterId, xpGained);
      return manager.save(
        ActivityLog,
        manager.create(ActivityLog, {
          characterId: dto.characterId,
          date: new Date(dto.date),
          content,
          summary: summary || null,
          aiResult: JSON.stringify(xpMap),
          xpGained,
        }),
      );
    });

    try {
      await this.analysisService.generateDailyAnalysisFromActivities(
        dto.characterId,
        dto.date,
      );
    } catch {
      // ignore
    }
    try {
      const goals = await this.goalService.findForDate(
        dto.characterId,
        dto.date,
      );
      for (const goal of goals) {
        await this.analysisService.generateGoalAnalysis(goal.id);
      }
    } catch {
      // ignore
    }

    return log;
  }

  private async applyAbilityXp(
    manager: EntityManager,
    characterId: string,
    abilityName: string,
    xpDelta: number,
  ): Promise<void> {
    const ability = await manager.findOne(Ability, {
      where: { characterId, name: abilityName.trim() },
    });
    if (!ability) return;
    const stat = await manager.findOne(AbilityStat, {
      where: { characterId, abilityId: ability.id },
    });
    if (!stat) return;
    const newXp = Math.min(
      ActivityService.MAX_ABILITY_XP,
      Math.max(0, stat.xp + xpDelta),
    );
    await manager.update(
      AbilityStat,
      { characterId, abilityId: ability.id },
      { xp: newXp },
    );
  }

  private async applyCharacterXp(
    manager: EntityManager,
    characterId: string,
    xpDelta: number,
  ): Promise<void> {
    const char = await manager.findOne(Character, { where: { id: characterId } });
    if (!char) throw new NotFoundException('Character not found');
    const newXp = Math.max(0, (char.xp ?? 0) + xpDelta);
    const newLevel = Math.max(1, 1 + Math.floor(newXp / 100));
    await manager.update(Character, characterId, { xp: newXp, level: newLevel });
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
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  findForDateRange(
    characterId: string,
    fromDate: string,
    toDate: string,
  ) {
    return this.repo
      .createQueryBuilder('log')
      .where('log.characterId = :characterId', { characterId })
      .andWhere('log.date >= :fromDate', { fromDate })
      .andWhere('log.date <= :toDate', { toDate })
      .orderBy('log.date', 'DESC')
      .addOrderBy('log.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string) {
    const log = await this.repo.findOne({
      where: { id },
      relations: ['character'],
    });
    if (!log) throw new NotFoundException('ActivityLog not found');
    return log;
  }

  remove(id: string) {
    return this.repo.delete(id);
  }
}
