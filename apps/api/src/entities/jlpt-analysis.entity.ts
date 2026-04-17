import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('jlpt_analyses')
export class JlptAnalysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 2 })
  level: 'N1' | 'N2' | 'N3' | 'N4' | 'N5';

  @Column('int')
  vocabularyScore: number;

  @Column('int')
  grammarScore: number;

  @Column('int')
  readingScore: number;

  @Column('int')
  totalScore: number;

  @Column('int')
  messageCount: number;

  @Column({ type: 'text', nullable: true })
  analysisDetail: string | null;

  @CreateDateColumn()
  analyzedAt: Date;
}
