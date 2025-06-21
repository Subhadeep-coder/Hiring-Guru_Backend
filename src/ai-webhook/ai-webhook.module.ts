import { Module } from '@nestjs/common';
import { AiWebhookService } from './ai-webhook.service';
import { AiWebhookController } from './ai-webhook.controller';

@Module({
  controllers: [AiWebhookController],
  providers: [AiWebhookService],
})
export class AiWebhookModule {}
