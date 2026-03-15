import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Character } from './character.entity';

@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  characterId: string;

  @ManyToOne(() => Character, (c) => c.activityLogs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'characterId' })
  character: Character;

  @Column('date', { nullable: true })
  date: Date | null;

  @Column('text')
  content: string;

  @Column('text', { nullable: true })
  summary: string | null;

  @Column('text', { nullable: true })
  aiResult: string | null;

  @Column('int', { default: 0 })
  xpGained: number;

  @CreateDateColumn()
  createdAt: Date;
}
