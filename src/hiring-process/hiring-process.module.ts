import { Module } from '@nestjs/common';
import { HiringProcessService } from './hiring-process.service';
import { HiringProcessController } from './hiring-process.controller';
import { PrismaModule } from '../../src/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
  ],
  controllers: [HiringProcessController],
  providers: [HiringProcessService],
})
export class HiringProcessModule { }
