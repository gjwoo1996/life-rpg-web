export class CreateGoalStepDto {
  goalId: string;
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  order?: number;
}
