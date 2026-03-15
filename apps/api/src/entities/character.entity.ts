import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Goal } from './goal.entity';
import { ActivityLog } from './activity-log.entity';
import { Ability } from './ability.entity';
import { DailyAnalysis } from './daily-analysis.entity';

@Entity('character')
export class Character {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('int', { default: 1 })
  level: number;

  @Column('int', { default: 0 })
  xp: number;

  @Column({ type: 'varchar', length: 7, nullable: true })
  activityCalendarColor: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Goal, (goal) => goal.character)
  goals: Goal[];

  @OneToMany(() => ActivityLog, (log) => log.character)
  activityLogs: ActivityLog[];

  @OneToMany(() => Ability, (ability) => ability.character)
  abilities: Ability[];

  @OneToMany(() => DailyAnalysis, (a) => a.character)
  dailyAnalyses: DailyAnalysis[];
}
