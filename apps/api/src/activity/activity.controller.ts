import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ActivityService } from './activity.service';
import { CreateActivityLogDto } from './dto/create-activity-log.dto';

@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Post()
  create(@Body() dto: CreateActivityLogDto) {
    return this.activityService.create(dto);
  }

  @Get()
  findAll(
    @Query('characterId') characterId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ) {
    if (characterId && fromDate && toDate) {
      return this.activityService.findByCharacterAndDateRange(
        characterId,
        fromDate,
        toDate,
      );
    }
    if (characterId) return this.activityService.findByCharacter(characterId);
    return this.activityService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.activityService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.activityService.remove(id);
  }
}
