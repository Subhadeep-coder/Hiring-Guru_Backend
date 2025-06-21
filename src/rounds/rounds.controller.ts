import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RoundsService } from './rounds.service';
import { GenerateQuestionsDto } from './dto/generate-questions.dto';
import { SubmitAnswersDto } from './dto/submit-answers.dto';
import { AuthenticatedGuard } from 'src/user/auth/guards/auth.guard';

@Controller('rounds')
@UseGuards(AuthenticatedGuard)
export class RoundsController {
  constructor(private readonly roundsService: RoundsService) { }

  @Post('generate-questions')
  async generateQuestions(@Body() dto: GenerateQuestionsDto) {
    return this.roundsService.generateQuestions(dto);
  }

  @Post('submit-answers')
  async submitAnswers(@Body() dto: SubmitAnswersDto) {
    return this.roundsService.submitAnswers(dto);
  }

  @Get(':roundId/questions')
  async getRoundQuestions(@Param('roundId') roundId: string) {
    return this.roundsService.getRoundQuestions(roundId);
  }

  @Get(':roundId/status')
  async getRoundStatus(@Param('roundId') roundId: string) {
    return this.roundsService.getRoundStatus(roundId);
  }
}