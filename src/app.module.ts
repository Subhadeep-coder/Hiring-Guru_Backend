import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { CustomAssessmentModule } from './custom-assessment/custom-assessment.module';
import { HiringProcessModule } from './hiring-process/hiring-process.module';
import { PredefinedAssessmentModule } from './predefined-assessment/predefined-assessment.module';

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
  ],
  providers: [],
})
export class AppModule { }