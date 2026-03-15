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
import { AbilityStat } from './ability-stat.entity';

@Entity('abilities')
export class Ability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  characterId: string;

  @ManyToOne(() => Character, (c) => c.abilities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'characterId' })
  character: Character;

  @Column()
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => AbilityStat, (stat) => stat.ability)
  stats: AbilityStat[];
}
