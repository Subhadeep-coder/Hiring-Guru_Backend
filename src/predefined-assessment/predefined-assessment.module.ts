import { Module } from '@nestjs/common';
import { PredefinedAssessmentService } from './predefined-assessment.service';
import { PredefinedAssessmentController } from './predefined-assessment.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
  ],
  controllers: [PredefinedAssessmentController],
  providers: [PredefinedAssessmentService],
})
export class PredefinedAssessmentModule { }
