import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from '../entities/activity-log.entity';
import { OllamaService } from '../ollama/ollama.service';
import { AbilityService } from '../ability/ability.service';
import { CharacterService } from '../character/character.service';
import { GoalService } from '../goal/goal.service';
import { AnalysisService } from '../analysis/analysis.service';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(ActivityLog)
    private readonly repo: Repository<ActivityLog>,
    private readonly ollama: OllamaService,
    private readonly abilityService: AbilityService,
    private readonly characterService: CharacterService,
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

    for (const [name, xp] of Object.entries(xpMap)) {
      if (xp > 0)
        await this.abilityService.addAbilityXp(dto.characterId, name, xp);
    }
    await this.characterService.addXp(dto.characterId, xpGained);

    const dateObj = new Date(dto.date);
    const log = await this.repo.save(
      this.repo.create({
        characterId: dto.characterId,
        date: dateObj,
        content,
        summary: summary || null,
        aiResult: JSON.stringify(xpMap),
        xpGained,
      }),
    );

    try {
      await this.analysisService.generateDailyAnalysisFromActivities(
        dto.characterId,
        dto.date,
      );
    } catch {
      // ignore
    }
    try {
      const goals = await this.goalService.listGoalsForDate(
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

  findByCharacterAndDateRange(
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
