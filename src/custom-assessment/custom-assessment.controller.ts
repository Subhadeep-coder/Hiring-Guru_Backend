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
import { AuthenticatedGuard } from '../../src/user/auth/guards/auth.guard';
import { CustomAssessmentService } from './custom-assessment.service';
import { CreateCustomAssessmentDto } from './dto/create-custom-assessment.dto';
import { UpdateCustomAssessmentDto } from './dto/update-custom-assessment.dto';

@Controller('custom-assessments')
export class CustomAssessmentController {
  constructor(private customAssessmentService: CustomAssessmentService) { }

  @Post()
  async createCustomAssessment(
    @Body() dto: CreateCustomAssessmentDto,
  ) {
    const userId = dto.userId;
    return this.customAssessmentService.createCustomAssessment(userId, dto);
  }

  @UseGuards(AuthenticatedGuard)
  @Put(':id')
  async updateCustomAssessment(
    @Req() req: any,
    @Param('id') assessmentId: string,
    @Body() dto: UpdateCustomAssessmentDto,
  ) {
    const userId = req.user.id;
    return this.customAssessmentService.updateCustomAssessment(userId, assessmentId, dto);
  }

  @UseGuards(AuthenticatedGuard)
  @Get()
  async getUserCustomAssessments(@Req() req: any) {
    const userId = req.user.id;
    return this.customAssessmentService.getUserCustomAssessments(userId);
  }

  @UseGuards(AuthenticatedGuard)
  @Get(':id')
  async getCustomAssessmentById(
    @Req() req: any,
    @Param('id') assessmentId: string,
  ) {
    const userId = req.user.id;
    return this.customAssessmentService.getCustomAssessmentById(userId, assessmentId);
  }
}