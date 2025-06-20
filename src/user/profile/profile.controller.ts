import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { AuthenticatedGuard } from '../auth/guards/auth.guard';

@Controller('user/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) { }

  // Session Management
  @Get('profile')
  @UseGuards(AuthenticatedGuard)
  getProfile(@Req() req: any) {
    return {
      user: req.user,
      message: 'Authentication successful',
    };
  }
}
