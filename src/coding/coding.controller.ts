import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { CodingService } from './coding.service';
import { RunCodeDto } from './dto/run-code.dto';
import { SubmitCodeDto } from './dto/submit-code.dto';
import { AuthenticatedGuard } from 'src/user/auth/guards/auth.guard';

@Controller('coding')
@UseGuards(AuthenticatedGuard)
export class CodingController {
  constructor(private readonly codingService: CodingService) { }

  @Post('run')
  async runCode(@Body() runCodeDto: RunCodeDto) {
    return this.codingService.runCode(runCodeDto);
  }

  @Post('submit')
  async submitCode(@Body() submitCodeDto: SubmitCodeDto) {
    return this.codingService.submitCode(submitCodeDto);
  }

  @Get('submissions/:roundId')
  async getSubmissionHistory(@Param('roundId') roundId: string) {
    return this.codingService.getSubmissionHistory(roundId);
  }

  @Get('submission/:submissionId')
  async getSubmissionDetails(@Param('submissionId') submissionId: string) {
    return this.codingService.getSubmissionDetails(submissionId);
  }
}
