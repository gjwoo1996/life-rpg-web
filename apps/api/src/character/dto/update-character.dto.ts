import { IsOptional, IsString, Matches, ValidateIf } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateCharacterDto } from './create-character.dto';

export class UpdateCharacterDto extends PartialType(CreateCharacterDto) {
  @IsOptional()
  @ValidateIf(
    (o: UpdateCharacterDto) =>
      o.activityCalendarColor != null && o.activityCalendarColor !== '',
  )
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'activityCalendarColor must be a hex color (e.g. #FEF3C7)',
  })
  activityCalendarColor?: string | null;
}
