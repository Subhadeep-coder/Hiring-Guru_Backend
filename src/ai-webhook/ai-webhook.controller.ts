import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';

interface AIVerificationResult {
  submissionId: string;
  roundId: string;
  results: {
    questionId: string;
    isCorrect: boolean;
    score: number;
    feedback?: string;
  }[];
  overallScore: number;
  feedback: {
    strengths: string[];
    improvements: string[];
    detailedFeedback: string;
  };
}

@ApiTags('ai-webhook')
@Controller('ai-webhook')
export class AIWebhookController {
  constructor(private prisma: PrismaService) { }

  @Post('verification-result')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive AI verification results' })
  async receiveVerificationResult(@Body() result: AIVerificationResult) {
    try {
      // Update individual responses with scores and feedback
      await Promise.all(
        result.results.map(async (r) => {
          await this.prisma.response.updateMany({
            where: {
              questionId: r.questionId,
              roundId: result.roundId
            },
            data: {
              isCorrect: r.isCorrect,
              score: r.score
            }
          });
        })
      );

      // Create round feedback
      await this.prisma.roundFeedback.create({
        data: {
          roundId: result.roundId,
          overallScore: result.overallScore,
          technicalScore: result.overallScore, // For text rounds, technical = overall
          strengths: result.feedback.strengths,
          improvements: result.feedback.improvements,
          detailedFeedback: result.feedback.detailedFeedback,
          eligibleForNext: result.overallScore >= 60, // 60% pass threshold
          recommendedAction: result.overallScore >= 60 ? 'proceed' : 'retry',
          generatedBy: 'ai-backend',
          confidence: 0.9 // High confidence for AI verification
        }
      });

      return { success: true, message: 'Verification result processed successfully' };
    } catch (error) {
      console.error('Error processing verification result:', error);
      return { success: false, message: 'Failed to process verification result' };
    }
  }
}