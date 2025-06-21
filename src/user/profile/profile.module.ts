import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GithubApiService } from './github-api.service';
import { AIService } from './ai.service';
import { AnalysisService } from './analysis.service';

@Module({
  imports: [
    PrismaModule,
  ],
  controllers: [ProfileController],
  providers: [
    ProfileService,
    GithubApiService,
    AIService,
    AnalysisService,
  ],
})
export class ProfileModule { }
