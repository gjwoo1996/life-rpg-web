import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { CreateDailyAnalysisDto } from './dto/create-daily-analysis.dto';
import { CreateGoalAnalysisDto } from './dto/create-goal-analysis.dto';

@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Get('daily')
  getDailyAnalysis(
    @Query('characterId') characterId: string,
    @Query('date') date: string,
  ) {
    return this.analysisService.getDailyAnalysis(characterId, date);
  }

  @Get('goal/:goalId')
  getGoalAnalysis(@Param('goalId') goalId: string) {
    return this.analysisService.getGoalAnalysis(goalId);
  }

  @Post('daily')
  createDailyAnalysis(@Body() dto: CreateDailyAnalysisDto) {
    return this.analysisService.createDailyAnalysis(dto);
  }

  @Post('daily/generate')
  generateDailyAnalysis(@Body() body: { characterId: string; date: string }) {
    return this.analysisService.generateDailyAnalysisFromActivities(
      body.characterId,
      body.date,
    );
  }

  @Post('goal')
  createGoalAnalysis(@Body() dto: CreateGoalAnalysisDto) {
    return this.analysisService.createGoalAnalysis(dto);
  }

  @Post('goal/:goalId/generate')
  generateGoalAnalysis(@Param('goalId') goalId: string) {
    return this.analysisService.generateGoalAnalysis(goalId);
  }
}
