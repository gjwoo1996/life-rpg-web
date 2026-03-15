import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateGoalDto {
  @IsString()
  characterId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsString()
  targetSkill: string;

  @IsOptional()
  @IsString()
  calendarColor?: string;
}
