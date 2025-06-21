import { Body, Controller, Get, Param, Post, Req, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { AuthenticatedGuard } from '../auth/guards/auth.guard';
import { AnalysisService } from './analysis.service';
import { CreateAnalysisDto } from './dto/analysis.dto';


@Controller('user')
export class ProfileController {
  constructor(
    private readonly analysisService: AnalysisService,
  ) { }

  // Session Management
  @UseGuards(AuthenticatedGuard)
  @Get('profile')
  async getProfile(@Req() req: any) {
    try {
      // Get user's latest analyses
      const userAnalyses = await this.analysisService.getAnalysisByUser(req.user.githubUsername);

      return {
        user: req.user,
        userAnalyses: userAnalyses,
        message: 'Authentication successful',
      };
    } catch (error) {
      // If user has no analyses yet, still return user data
      return {
        user: req.user,
        userAnalyses: [],
        message: 'Authentication successful',
      };
    }
  }

  // Get GitHub data for a user (used to populate analysis form)
  @UseGuards(AuthenticatedGuard)
  @Get('github/:username')
  async getGithubData(@Req() req: any, @Param('username') username: string) {
    try {
      return await this.analysisService.getGithubData(username);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch GitHub data',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // Create new analysis by sending data to AI backend
  @UseGuards(AuthenticatedGuard)
  @Post('analysis')
  async createAnalysis(@Req() req: any, @Body() createAnalysisDto: CreateAnalysisDto) {
    try {
      return await this.analysisService.createAnalysis(createAnalysisDto, req.user.id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to create analysis',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Get analysis history for a user
  @UseGuards(AuthenticatedGuard)
  @Get('analysis/:username')
  async getUserAnalyses(@Param('username') username: string) {
    try {
      return await this.analysisService.getAnalysisByUser(username);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch user analyses',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Get specific analysis by ID
  @Get('analysis/details/:id')
  async getAnalysisById(@Param('id') id: string) {
    try {
      return await this.analysisService.getAnalysisById(id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch analysis details',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}