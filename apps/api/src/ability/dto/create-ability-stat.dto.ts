import { IsString, IsNumber } from 'class-validator';

export class CreateAbilityStatDto {
  @IsString()
  characterId: string;

  @IsString()
  abilityId: string;

  @IsNumber()
  xp: number;
}
