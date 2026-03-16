import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Character } from './character.entity';
import { GoalAnalysis } from './goal-analysis.entity';

@Entity('goals')
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  characterId: string;

  @ManyToOne(() => Character, (c) => c.goals, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'characterId' })
  character: Character;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column('date', { nullable: true })
  startDate: Date | null;

  @Column('date', { nullable: true })
  endDate: Date | null;

  @Column({ type: 'varchar', nullable: true })
  targetSkill: string | null;

  @Column({ default: '#6366f1' })
  calendarColor: string;

  @Column({ type: 'text', nullable: true })
  goalAnalysisPromptTemplate: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  goalAnalysisUserInstruction: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => GoalAnalysis, (a) => a.goal)
  goalAnalyses: GoalAnalysis[];
}
