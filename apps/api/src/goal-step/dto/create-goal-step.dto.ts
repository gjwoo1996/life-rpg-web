import { IsString, IsUUID, IsOptional, IsInt, Min } from 'class-validator';

export class CreateGoalStepDto {
  @IsUUID()
  goalId: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
