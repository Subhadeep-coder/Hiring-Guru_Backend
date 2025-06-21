import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { AuthenticatedGuard } from '../auth/guards/auth.guard';
import { AnalysisService } from './analysis.service';
import { CreateAnalysisDto } from './dto/analysis.dto';

@UseGuards(AuthenticatedGuard)
@Controller('user/profile')
export class ProfileController {
  constructor(
    private readonly profileService: ProfileService,
    private readonly analysisService: AnalysisService,
  ) { }

  // Session Management
  @Get('profile')
  getProfile(@Req() req: any) {
    return {
      user: req.user,
      message: 'Authentication successful',
    };
  }

  @Post('analysis')
  async createAnalysis(@Body() createAnalysisDto: CreateAnalysisDto) {
    return this.analysisService.createAnalysis(createAnalysisDto);
  }

  @Get(':username')
  async getUserAnalyses(@Param('username') username: string) {
    return this.analysisService.getAnalysisByUser(username);
  }

  @Get('github/:username')
  async getGithubData(@Param('username') username: string) {
    return this.analysisService.getGithubData(username);
  }
}
