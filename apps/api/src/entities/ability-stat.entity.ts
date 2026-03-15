import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Ability } from './ability.entity';
import { Character } from './character.entity';

/** One row per (character, ability) with total XP. Matches life-rpg ability_stats. */
@Entity('ability_stats')
export class AbilityStat {
  @PrimaryColumn('uuid')
  characterId: string;

  @PrimaryColumn('uuid')
  abilityId: string;

  @Column('int', { default: 0 })
  xp: number;

  @ManyToOne(() => Character, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'characterId' })
  character: Character;

  @ManyToOne(() => Ability, (a) => a.stats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'abilityId' })
  ability: Ability;
}
