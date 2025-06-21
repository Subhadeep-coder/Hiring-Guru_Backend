import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CodingController } from './coding.controller';
import { CodingService } from './coding.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    HttpModule,
    PrismaModule,
  ],
  controllers: [CodingController],
  providers: [CodingService],
  exports: [CodingService],
})
export class CodingModule { }