export class UpdateGoalStepDto {
  title?: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  order?: number;
}
