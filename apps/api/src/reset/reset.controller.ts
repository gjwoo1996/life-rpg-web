import { Controller, Post } from '@nestjs/common';
import { ResetService } from './reset.service';

@Controller('reset')
export class ResetController {
  constructor(private readonly resetService: ResetService) {}

  @Post()
  resetApp() {
    return this.resetService.resetApp();
  }
}
