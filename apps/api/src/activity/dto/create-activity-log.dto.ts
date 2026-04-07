import { IsString, IsDateString, IsNotEmpty } from 'class-validator';

export class CreateActivityLogDto {
  @IsString()
  @IsNotEmpty()
  characterId: string;

  @IsDateString()
  date: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
