import { Module } from '@nestjs/common';
import { CustomAssessmentService } from './custom-assessment.service';
import { CustomAssessmentController } from './custom-assessment.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
  ],
  controllers: [CustomAssessmentController],
  providers: [CustomAssessmentService],
})
export class CustomAssessmentModule { }
