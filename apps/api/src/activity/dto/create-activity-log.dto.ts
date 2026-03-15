import { IsString, IsDateString } from 'class-validator';

export class CreateActivityLogDto {
  @IsString()
  characterId: string;

  @IsDateString()
  date: string;

  @IsString()
  content: string;
}
