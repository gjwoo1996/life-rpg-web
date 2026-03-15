import { IsString } from 'class-validator';

export class CreateGoalAnalysisDto {
  @IsString()
  goalId: string;

  @IsString()
  content: string;
}
