import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { AbilityService } from './ability.service';
import { CreateAbilityDto } from './dto/create-ability.dto';
import { UpdateAbilityDto } from './dto/update-ability.dto';
import { CreateAbilityStatDto } from './dto/create-ability-stat.dto';

@Controller('ability')
export class AbilityController {
  constructor(private readonly abilityService: AbilityService) {}

  @Post()
  create(@Body() dto: CreateAbilityDto) {
    return this.abilityService.create(dto);
  }

  @Get('stats')
  getStats(@Query('characterId') characterId: string) {
    return this.abilityService.getStats(characterId);
  }

  @Post('stats')
  addStat(@Body() dto: CreateAbilityStatDto) {
    return this.abilityService.addStat(dto);
  }

  @Get()
  findAll(@Query('characterId') characterId?: string) {
    if (characterId) return this.abilityService.findByCharacter(characterId);
    return this.abilityService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.abilityService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAbilityDto) {
    return this.abilityService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.abilityService.remove(id);
  }
}
