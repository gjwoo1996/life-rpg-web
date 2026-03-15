import { IsString, IsDateString } from 'class-validator';

export class CreateDailyAnalysisDto {
  @IsString()
  characterId: string;

  @IsDateString()
  date: string;

  @IsString()
  content: string;
}
