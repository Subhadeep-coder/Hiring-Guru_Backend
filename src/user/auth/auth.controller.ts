import { 
  Controller, 
  Get, 
  Post, 
  UseGuards, 
  Req, 
  Res, 
  HttpStatus 
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { GitHubAuthGuard } from './guards/github-auth.guard';
import { AuthenticatedGuard } from './guards/auth.guard';

@Controller('user/auth')
export class AuthController {
  constructor(private configService: ConfigService) {}

  // Google OAuth Routes
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Req() req: Request) {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const frontendUrl = this.configService.get('FRONTEND_URL');
    res.redirect(`${frontendUrl}/dashboard`);
  }

  // GitHub OAuth Routes  
  @Get('github')
  @UseGuards(GitHubAuthGuard)
  async githubAuth(@Req() req: Request) {
    // Guard redirects to GitHub
  }

  @Get('github/callback')
  @UseGuards(GitHubAuthGuard)
  async githubAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const frontendUrl = this.configService.get('FRONTEND_URL');
    res.redirect(`${frontendUrl}/dashboard`);
  }

  @Get('status')
  getAuthStatus(@Req() req: Request) {
    return {
      isAuthenticated: req.isAuthenticated(),
      user: req.isAuthenticated() ? req.user : null,
    };
  }

  @Post('logout')
  logout(@Req() req: any, @Res() res: Response) {
    req.logout((err) => {
      if (err) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          message: 'Logout failed',
        });
      }
      
      req.session.destroy((err) => {
        if (err) {
          return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            message: 'Session destruction failed',
          });
        }
        
        res.clearCookie('connect.sid');
        res.status(HttpStatus.OK).json({
          message: 'Logout successful',
        });
      });
    });
  }
}