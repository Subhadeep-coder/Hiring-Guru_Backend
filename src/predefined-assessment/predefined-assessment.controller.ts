import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthenticatedGuard } from 'src/user/auth/guards/auth.guard';
import { PredefinedAssessmentService } from './predefined-assessment.service';

@Controller('predefined-assessments')
@UseGuards(AuthenticatedGuard)
export class PredefinedAssessmentController {
  constructor(private predefinedAssessmentService: PredefinedAssessmentService) { }

  @Get()
  async getPredefinedAssessments() {
    return this.predefinedAssessmentService.getPredefinedAssessments();
  }

  @Get(':id')
  async getPredefinedAssessmentById(@Param('id') assessmentId: string) {
    return this.predefinedAssessmentService.getPredefinedAssessmentById(assessmentId);
  }
}