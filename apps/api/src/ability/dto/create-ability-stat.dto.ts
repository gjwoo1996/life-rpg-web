import { IsString, IsNumber, Min } from 'class-validator';

export class CreateAbilityStatDto {
  @IsString()
  characterId: string;

  @IsString()
  abilityId: string;

  @IsNumber()
  @Min(0)
  xp: number;
}
