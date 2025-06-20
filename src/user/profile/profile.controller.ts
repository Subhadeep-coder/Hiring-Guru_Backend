import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { AuthenticatedGuard } from '../auth/guards/auth.guard';
import { UpdateUserPreferencesDto } from './dto/update-user-preferences.dto';
import { CreateUserPreferencesDto } from './dto/create-user-preferences.dto';

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

  @Post()
  create(@Body() dto: CreateUserPreferencesDto) {
    return this.profileService.create(dto);
  }

  @Get(':userId')
  findByUserId(@Req() req: any) {
    return this.profileService.findByUserId(req.user.userId);
  }

  @Patch(':userId')
  update(
    @Req() req: any,
    @Body() dto: UpdateUserPreferencesDto,
  ) {
    return this.profileService.update(req.user.userId, dto);
  }
}
