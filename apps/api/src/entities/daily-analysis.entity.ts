import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Character } from './character.entity';

@Entity('daily_analyses')
export class DailyAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  characterId: string;

  @ManyToOne(() => Character, (c) => c.dailyAnalyses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'characterId' })
  character: Character;

  @Column('date')
  date: Date;

  @Column('text')
  content: string;

  @CreateDateColumn()
  createdAt: Date;
}
