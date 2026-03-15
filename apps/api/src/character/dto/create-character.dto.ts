import { IsString } from 'class-validator';

export class CreateCharacterDto {
  @IsString()
  name: string;
}
