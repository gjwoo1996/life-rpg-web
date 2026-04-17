import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  message: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  model?: string;
}
