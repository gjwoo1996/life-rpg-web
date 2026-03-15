import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Character } from '../entities/character.entity';
import { CreateCharacterDto } from './dto/create-character.dto';
import { UpdateCharacterDto } from './dto/update-character.dto';

@Injectable()
export class CharacterService {
  constructor(
    @InjectRepository(Character)
    private readonly repo: Repository<Character>,
  ) {}

  create(dto: CreateCharacterDto) {
    return this.repo.save(this.repo.create({ ...dto, level: 1, xp: 0 }));
  }

  findAll() {
    return this.repo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const char = await this.repo.findOne({
      where: { id },
      relations: ['goals', 'abilities'],
    });
    if (!char) throw new NotFoundException('Character not found');
    return char;
  }

  async update(id: string, dto: UpdateCharacterDto) {
    await this.repo.update(id, dto as Partial<Character>);
    return this.findOne(id);
  }

  /** Add XP and recalc level (life-rpg xp_to_level: max(1, 1 + xp/100)). Returns [newLevel, newXp]. */
  async addXp(
    characterId: string,
    xpDelta: number,
  ): Promise<{ level: number; xp: number }> {
    const char = await this.repo.findOne({ where: { id: characterId } });
    if (!char) throw new NotFoundException('Character not found');
    const newXp = Math.max(0, (char.xp ?? 0) + xpDelta);
    const newLevel = Math.max(1, 1 + Math.floor(newXp / 100));
    await this.repo.update(characterId, { xp: newXp, level: newLevel });
    return { level: newLevel, xp: newXp };
  }

  remove(id: string) {
    return this.repo.delete(id);
  }
}
