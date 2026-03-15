import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Goal } from './goal.entity';

@Entity('goal_analyses')
export class GoalAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  goalId: string;

  @ManyToOne(() => Goal, (g) => g.goalAnalyses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'goalId' })
  goal: Goal;

  @Column('text', { nullable: true })
  summarizedContext: string | null;

  @Column('timestamp', { nullable: true })
  lastAnalyzedAt: Date | null;

  @Column('text')
  content: string;

  @CreateDateColumn()
  createdAt: Date;
}
