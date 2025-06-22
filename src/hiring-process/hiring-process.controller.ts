import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req
} from '@nestjs/common';
import { AuthenticatedGuard } from '../../src/user/auth/guards/auth.guard';
import { HiringProcessService } from './hiring-process.service';
import { StartHiringProcessDto } from './dto/start-hiring-process.dto';

@Controller('hiring-processes')
@UseGuards(AuthenticatedGuard)
export class HiringProcessController {
  constructor(private hiringProcessService: HiringProcessService) { }

  @Post('start')
  async startHiringProcess(
    @Req() req: any,
    @Body() dto: StartHiringProcessDto,
  ) {
    const userId = req.user.id;
    return this.hiringProcessService.startHiringProcess(userId, dto);
  }

  @Get()
  async getUserHiringProcesses(@Req() req: any) {
    const userId = req.user.id;
    return this.hiringProcessService.getUserHiringProcesses(userId);
  }

  @Get(':id')
  async getHiringProcessById(
    @Req() req: any,
    @Param('id') processId: string,
  ) {
    const userId = req.user.id;
    return this.hiringProcessService.getHiringProcessById(userId, processId);
  }
}