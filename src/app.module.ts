import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { CustomAssessmentModule } from './custom-assessment/custom-assessment.module';
import { HiringProcessModule } from './hiring-process/hiring-process.module';
import { PredefinedAssessmentModule } from './predefined-assessment/predefined-assessment.module';
import { RoundsModule } from './rounds/rounds.module';
import { AiWebhookModule } from './ai-webhook/ai-webhook.module';
import { CodingModule } from './coding/coding.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UserModule,
    CustomAssessmentModule,
    HiringProcessModule,
    PredefinedAssessmentModule,
    RoundsModule,
    AiWebhookModule,
    CodingModule,
  ],
  providers: [],
})
export class AppModule { }