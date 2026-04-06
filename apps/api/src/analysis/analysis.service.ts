import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from '../entities/activity-log.entity';
import { DailyAnalysis } from '../entities/daily-analysis.entity';
import { Goal } from '../entities/goal.entity';
import { GoalStep } from '../entities/goal-step.entity';
import { GoalAnalysis } from '../entities/goal-analysis.entity';
import { OllamaService } from '../ollama/ollama.service';
import { CreateDailyAnalysisDto } from './dto/create-daily-analysis.dto';
import { CreateGoalAnalysisDto } from './dto/create-goal-analysis.dto';

@Injectable()
export class AnalysisService {
  constructor(
    @InjectRepository(DailyAnalysis)
    private readonly dailyRepo: Repository<DailyAnalysis>,
    @InjectRepository(GoalAnalysis)
    private readonly goalAnalysisRepo: Repository<GoalAnalysis>,
    @InjectRepository(ActivityLog)
    private readonly activityRepo: Repository<ActivityLog>,
    @InjectRepository(Goal)
    private readonly goalRepo: Repository<Goal>,
    @InjectRepository(GoalStep)
    private readonly goalStepRepo: Repository<GoalStep>,
    private readonly ollama: OllamaService,
  ) {}

  async findDailyAnalysis(characterId: string, date: string) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return this.dailyRepo.findOne({
      where: { characterId, date: d },
      order: { createdAt: 'DESC' },
    });
  }

  findGoalAnalysis(goalId: string) {
    return this.goalAnalysisRepo.find({
      where: { goalId },
      order: { createdAt: 'DESC' },
      relations: ['goal'],
    });
  }

  createDailyAnalysis(dto: CreateDailyAnalysisDto) {
    return this.dailyRepo.save(
      this.dailyRepo.create({
        ...dto,
        date: new Date(dto.date),
      }),
    );
  }

  createGoalAnalysis(dto: CreateGoalAnalysisDto) {
    return this.goalAnalysisRepo.save(this.goalAnalysisRepo.create(dto));
  }

  /** Generate daily analysis from activities for the given date (uses log.date column). */
  async generateDailyAnalysisFromActivities(characterId: string, date: string) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const logs = await this.activityRepo
      .createQueryBuilder('log')
      .where('log.characterId = :characterId', { characterId })
      .andWhere('log.date = :d', { d })
      .orderBy('log.createdAt', 'ASC')
      .getMany();
    const activitiesText = logs
      .map((l) => (l.summary ? `[${l.summary}] ${l.content}` : l.content))
      .join('\n');
    if (!activitiesText.trim()) {
      return this.dailyRepo.save(
        this.dailyRepo.create({
          characterId,
          date: d,
          content: 'No activities recorded.',
        }),
      );
    }
    const prompt: string = this.ollama.buildDailyAnalysisPrompt(activitiesText);
    const analysisText = await this.ollama.generateInKoreanOnly(prompt);
    const existing: DailyAnalysis | null = await this.dailyRepo.findOne({
      where: { characterId, date: d },
    });
    if (existing) {
      await this.dailyRepo.update(existing.id, {
        content: analysisText || 'No analysis generated.',
      });
      const updated: DailyAnalysis | null = await this.dailyRepo.findOne({
        where: { id: existing.id },
      });
      return updated;
    }
    const created: DailyAnalysis = this.dailyRepo.create({
      characterId,
      date: d,
      content: analysisText || 'No analysis generated.',
    });
    return this.dailyRepo.save(created);
  }

  /** Generate goal analysis from activities in goal date range (life-rpg get_goal_analysis_text). */
  async generateGoalAnalysis(goalId: string) {
    const goal = await this.goalRepo.findOne({
      where: { id: goalId },
      relations: ['goalAnalyses'],
    });
    if (!goal) throw new NotFoundException('Goal not found');
    const startDate = goal.startDate
      ? new Date(goal.startDate).toISOString().slice(0, 10)
      : '0000-01-01';
    const endDate = goal.endDate
      ? new Date(goal.endDate).toISOString().slice(0, 10)
      : '9999-12-31';
    const logs = await this.activityRepo
      .createQueryBuilder('log')
      .where('log.characterId = :characterId', {
        characterId: goal.characterId,
      })
      .andWhere('log.date >= :startDate', { startDate })
      .andWhere('log.date <= :endDate', { endDate })
      .orderBy('log.date', 'ASC')
      .addOrderBy('log.createdAt', 'ASC')
      .getMany();
    const activitiesText = logs
      .map((l) => {
        const d = l.date ? new Date(l.date).toISOString().slice(0, 10) : '';
        return l.summary
          ? `[${d}] ${l.summary} - ${l.content}`
          : `[${d}] ${l.content}`;
      })
      .join('\n');

    const steps = await this.goalStepRepo.find({
      where: { goalId },
      order: { order: 'ASC', startDate: 'ASC', createdAt: 'ASC' },
    });
    const stepsText = steps
      .map((s, idx) => {
        const baseDate = s.startDate ?? s.endDate ?? null;
        const d = baseDate
          ? new Date(baseDate).toISOString().slice(0, 10)
          : '';
        const idxLabel = idx + 1;
        return d
          ? `${idxLabel}. [${d}] ${s.title} - ${s.description ?? ''}`
          : `${idxLabel}. ${s.title} - ${s.description ?? ''}`;
      })
      .join('\n');
    const sorted = (goal.goalAnalyses ?? []).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    const prevAnalysis = sorted[0];
    const previousContext =
      prevAnalysis?.content ?? prevAnalysis?.summarizedContext ?? '';
    const targetSkill = goal.targetSkill ?? '';
    const prompt: string = goal.goalAnalysisPromptTemplate?.trim()
      ? this.ollama.buildGoalAnalysisPromptFromTemplate(
          goal.goalAnalysisPromptTemplate,
          goal.title,
          targetSkill,
          previousContext,
          stepsText
            ? `${activitiesText}\n\n[Steps]\n${stepsText}`
            : activitiesText,
        )
      : this.ollama.buildGoalAnalysisPromptFixed(
          goal.title,
          targetSkill,
          previousContext,
          stepsText
            ? `${activitiesText}\n\n[Steps]\n${stepsText}`
            : activitiesText,
          goal.goalAnalysisUserInstruction ?? null,
        );

    const analysisText = await this.ollama.generateInKoreanOnly(prompt);
    const now = new Date();
    const toSave: GoalAnalysis = this.goalAnalysisRepo.create({
      goalId,
      summarizedContext: null,
      lastAnalyzedAt: now,
      content: analysisText || 'No analysis generated.',
    });
    return this.goalAnalysisRepo.save(toSave);
  }
}
