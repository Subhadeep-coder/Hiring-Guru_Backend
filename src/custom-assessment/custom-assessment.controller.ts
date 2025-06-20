import {
  Controller,
  Post,
  Put,
  Get,
  Body,
  Param,
  UseGuards,
  Req
} from '@nestjs/common';
import { AuthenticatedGuard } from 'src/user/auth/guards/auth.guard';
import { CustomAssessmentService } from './custom-assessment.service';
import { CreateCustomAssessmentDto } from './dto/create-custom-assessment.dto';
import { UpdateCustomAssessmentDto } from './dto/update-custom-assessment.dto';

@Controller('custom-assessments')
@UseGuards(AuthenticatedGuard)
export class CustomAssessmentController {
  constructor(private customAssessmentService: CustomAssessmentService) { }

  @Post()
  async createCustomAssessment(
    @Req() req: any,
    @Body() dto: CreateCustomAssessmentDto,
  ) {
    const userId = req.user.id;
    return this.customAssessmentService.createCustomAssessment(userId, dto);
  }

  @Put(':id')
  async updateCustomAssessment(
    @Req() req: any,
    @Param('id') assessmentId: string,
    @Body() dto: UpdateCustomAssessmentDto,
  ) {
    const userId = req.user.id;
    return this.customAssessmentService.updateCustomAssessment(userId, assessmentId, dto);
  }

  @Get()
  async getUserCustomAssessments(@Req() req: any) {
    const userId = req.user.id;
    return this.customAssessmentService.getUserCustomAssessments(userId);
  }

  @Get(':id')
  async getCustomAssessmentById(
    @Req() req: any,
    @Param('id') assessmentId: string,
  ) {
    const userId = req.user.id;
    return this.customAssessmentService.getCustomAssessmentById(userId, assessmentId);
  }
}