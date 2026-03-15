import { IsString } from 'class-validator';

export class CreateAbilityDto {
  @IsString()
  characterId: string;

  @IsString()
  name: string;
}
