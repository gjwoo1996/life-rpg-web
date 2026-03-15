import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ability } from '../entities/ability.entity';
import { AbilityStat } from '../entities/ability-stat.entity';
import { CreateAbilityDto } from './dto/create-ability.dto';
import { UpdateAbilityDto } from './dto/update-ability.dto';
import { CreateAbilityStatDto } from './dto/create-ability-stat.dto';

@Injectable()
export class AbilityService {
  constructor(
    @InjectRepository(Ability)
    private readonly abilityRepo: Repository<Ability>,
    @InjectRepository(AbilityStat)
    private readonly statRepo: Repository<AbilityStat>,
  ) {}

  create(dto: CreateAbilityDto) {
    return this.abilityRepo.save(this.abilityRepo.create(dto));
  }

  /** Ensure ability exists for character; create Ability + AbilityStat(xp=0) if not. Returns ability id. */
  async ensureAbility(characterId: string, name: string): Promise<string> {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Ability name cannot be empty');
    let ability = await this.abilityRepo.findOne({
      where: { characterId, name: trimmed },
    });
    if (!ability) {
      ability = await this.abilityRepo.save(
        this.abilityRepo.create({ characterId, name: trimmed }),
      );
    }
    const existing = await this.statRepo.findOne({
      where: { characterId, abilityId: ability.id },
    });
    if (!existing) {
      await this.statRepo.save(
        this.statRepo.create({
          characterId,
          abilityId: ability.id,
          xp: 0,
        }),
      );
    }
    return ability.id;
  }

  /** Get ability stats for character: abilityId, name, xp (matches life-rpg get_ability_stats). */
  async getStats(
    characterId: string,
  ): Promise<{ abilityId: string; name: string; xp: number }[]> {
    const abilities = await this.abilityRepo.find({
      where: { characterId },
      order: { name: 'ASC' },
      relations: ['stats'],
    });
    return abilities.map((a) => {
      const stat = a.stats?.[0];
      return {
        abilityId: a.id,
        name: a.name,
        xp: stat?.xp ?? 0,
      };
    });
  }

  private static readonly MAX_ABILITY_XP = 100;

  /** Add XP to ability stat (upsert row, cap at MAX_ABILITY_XP). */
  async addStat(dto: CreateAbilityStatDto) {
    let row = await this.statRepo.findOne({
      where: { characterId: dto.characterId, abilityId: dto.abilityId },
    });
    if (!row) {
      row = await this.statRepo.save(
        this.statRepo.create({
          characterId: dto.characterId,
          abilityId: dto.abilityId,
          xp: 0,
        }),
      );
    }
    const newXp = Math.min(
      AbilityService.MAX_ABILITY_XP,
      Math.max(0, row.xp + dto.xp),
    );
    await this.statRepo.update(
      { characterId: dto.characterId, abilityId: dto.abilityId },
      { xp: newXp },
    );
    return this.statRepo.findOne({
      where: { characterId: dto.characterId, abilityId: dto.abilityId },
    });
  }

  /** Internal: add XP by ability name (used by activity flow). */
  async addAbilityXp(
    characterId: string,
    abilityName: string,
    xpDelta: number,
  ): Promise<number> {
    const ability = await this.abilityRepo.findOne({
      where: { characterId, name: abilityName.trim() },
    });
    if (!ability) return 0;
    await this.addStat({
      characterId,
      abilityId: ability.id,
      xp: xpDelta,
    });
    const row = await this.statRepo.findOne({
      where: { characterId, abilityId: ability.id },
    });
    return row?.xp ?? 0;
  }

  findAll() {
    return this.abilityRepo.find({
      order: { createdAt: 'DESC' },
      relations: ['character', 'stats'],
    });
  }

  findByCharacter(characterId: string) {
    return this.abilityRepo.find({
      where: { characterId },
      order: { createdAt: 'DESC' },
      relations: ['stats'],
    });
  }

  async findOne(id: string) {
    const ability = await this.abilityRepo.findOne({
      where: { id },
      relations: ['character', 'stats'],
    });
    if (!ability) throw new NotFoundException('Ability not found');
    return ability;
  }

  async update(id: string, dto: UpdateAbilityDto) {
    await this.abilityRepo.update(id, dto as Partial<Ability>);
    return this.findOne(id);
  }

  remove(id: string) {
    return this.abilityRepo.delete(id);
  }
}
