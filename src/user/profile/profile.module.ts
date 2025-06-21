import { Module } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GithubApiService } from './github-api.service';
import { AIService } from './ai.service';
import { AnalysisService } from './analysis.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    PrismaModule,
    HttpModule,
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
