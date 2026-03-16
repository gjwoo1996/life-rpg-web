import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Character } from '../entities/character.entity';
import { Goal } from '../entities/goal.entity';
import { ActivityLog } from '../entities/activity-log.entity';
import { Ability } from '../entities/ability.entity';
import { AbilityStat } from '../entities/ability-stat.entity';
import { DailyAnalysis } from '../entities/daily-analysis.entity';
import { GoalAnalysis } from '../entities/goal-analysis.entity';

@Injectable()
export class ResetService {
  constructor(
    @InjectRepository(GoalAnalysis)
    private readonly goalAnalysisRepo: Repository<GoalAnalysis>,
    @InjectRepository(DailyAnalysis)
    private readonly dailyRepo: Repository<DailyAnalysis>,
    @InjectRepository(AbilityStat)
    private readonly abilityStatRepo: Repository<AbilityStat>,
    @InjectRepository(Ability)
    private readonly abilityRepo: Repository<Ability>,
    @InjectRepository(ActivityLog)
    private readonly activityRepo: Repository<ActivityLog>,
    @InjectRepository(Goal)
    private readonly goalRepo: Repository<Goal>,
    @InjectRepository(Character)
    private readonly characterRepo: Repository<Character>,
  ) {}

  /** 앱 데이터 전체 리셋 (life-rpg reset_app 대응) - FK 순서 준수 */
  async resetApp() {
    // clear()는 TRUNCATE를 써서 FK 제약에 걸리므로, QueryBuilder DELETE로 자식→부모 순 삭제
    await this.goalAnalysisRepo
      .createQueryBuilder()
      .delete()
      .from(GoalAnalysis)
      .execute();
    await this.dailyRepo
      .createQueryBuilder()
      .delete()
      .from(DailyAnalysis)
      .execute();
    await this.abilityStatRepo
      .createQueryBuilder()
      .delete()
      .from(AbilityStat)
      .execute();
    await this.abilityRepo
      .createQueryBuilder()
      .delete()
      .from(Ability)
      .execute();
    await this.activityRepo
      .createQueryBuilder()
      .delete()
      .from(ActivityLog)
      .execute();
    await this.goalRepo.createQueryBuilder().delete().from(Goal).execute();
    await this.characterRepo
      .createQueryBuilder()
      .delete()
      .from(Character)
      .execute();
    return { ok: true, message: 'All data reset.' };
  }
}
