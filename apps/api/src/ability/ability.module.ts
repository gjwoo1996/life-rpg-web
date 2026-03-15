import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ability } from '../entities/ability.entity';
import { AbilityStat } from '../entities/ability-stat.entity';
import { AbilityController } from './ability.controller';
import { AbilityService } from './ability.service';

@Module({
  imports: [TypeOrmModule.forFeature([Ability, AbilityStat])],
  controllers: [AbilityController],
  providers: [AbilityService],
  exports: [AbilityService],
})
export class AbilityModule {}
