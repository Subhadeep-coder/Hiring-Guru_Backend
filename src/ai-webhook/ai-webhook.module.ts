import { Module } from '@nestjs/common';
import { AIWebhookController } from './ai-webhook.controller';
import { PrismaModule } from '../../src/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
  ],
  controllers: [AIWebhookController],
})
export class AiWebhookModule { }
