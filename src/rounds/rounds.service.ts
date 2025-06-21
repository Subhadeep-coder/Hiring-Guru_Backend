import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { GenerateQuestionsDto } from './dto/generate-questions.dto';
import { SubmitAnswersDto } from './dto/submit-answers.dto';
import {
    GenerateQuestionsResponse,
    SubmitAnswersResponse,
    AIVerificationPayload
} from './interfaces/round.interface';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class RoundsService {
    constructor(
        private prisma: PrismaService,
        private httpService: HttpService,
        private configService: ConfigService,
    ) { }

    async generateQuestions(dto: GenerateQuestionsDto): Promise<GenerateQuestionsResponse> {
        // Verify round exists and belongs to user
        const round = await this.prisma.round.findUnique({
            where: { id: dto.roundId },
            include: {
                hiringProcess: {
                    include: { user: true }
                }
            }
        });

        if (!round) {
            throw new NotFoundException('Round not found');
        }

        // Check if round is in correct status
        if (!['IN_PREPARATION', 'NOT_STARTED'].includes(round.status)) {
            throw new BadRequestException('Round is not in a state to generate questions');
        }

        try {
            // Prepare AI backend payload
            const aiPayload = {
                roundType: dto.roundType,
                difficulty: dto.difficulty,
                questionCount: dto.questionCount,
                category: dto.category,
                duration: dto.duration
            };

            // Call AI backend to generate questions
            const aiBackendUrl = this.configService.get<string>('AI_BACKEND_URL');

            const response = await firstValueFrom(
                this.httpService.post(`${aiBackendUrl}/generate-questions`, aiPayload, {
                    headers: {
                        'Content-Type': 'application/json',
                    }
                })
            );

            const aiGeneratedQuestions = response.data;

            // Store questions in database
            const questions = await Promise.all(
                aiGeneratedQuestions.questions.map(async (q: any) => {
                    return await this.prisma.question.create({
                        data: {
                            roundId: dto.roundId,
                            content: q.content,
                            type: q.type,
                            difficulty: q.difficulty,
                            category: q.category,
                            options: q.options || [],
                            correctAnswer: q.correctAnswer,
                            generatedBy: 'ai-backend',
                            prompt: `Generated for ${dto.roundType} round with difficulty ${dto.difficulty}`
                        }
                    });
                })
            );

            // Update round status
            await this.prisma.round.update({
                where: { id: dto.roundId },
                data: {
                    status: 'IN_PREPARATION'
                }
            });

            return {
                success: true,
                roundId: dto.roundId,
                questions: questions.map(q => ({
                    id: q.id,
                    content: q.content,
                    type: q.type as 'MCQ' | 'SUBJECTIVE',
                    difficulty: q.difficulty,
                    category: q.category || undefined,
                    options: q.options.length > 0 ? q.options : undefined,
                    correctAnswer: q.correctAnswer || undefined
                })),
                totalQuestions: questions.length,
                estimatedDuration: dto.duration
            };

        } catch (error) {
            console.error('Error generating questions:', error);
            throw new BadRequestException('Failed to generate questions from AI backend');
        }
    }

    async submitAnswers(dto: SubmitAnswersDto): Promise<SubmitAnswersResponse> {
        // Verify round exists and is in progress
        const round = await this.prisma.round.findUnique({
            where: { id: dto.roundId },
            include: {
                questions: true,
                hiringProcess: true
            }
        });

        if (!round) {
            throw new NotFoundException('Round not found');
        }

        if (round.status !== 'IN_PROGRESS') {
            throw new BadRequestException('Round is not in progress');
        }

        // Validate all question IDs exist
        const questionIds = round.questions.map(q => q.id);
        const submittedQuestionIds = dto.answers.map(a => a.questionId);
        const invalidQuestionIds = submittedQuestionIds.filter(id => !questionIds.includes(id));

        if (invalidQuestionIds.length > 0) {
            throw new BadRequestException(`Invalid question IDs: ${invalidQuestionIds.join(', ')}`);
        }

        try {
            // Store responses in database
            const responses = await Promise.all(
                dto.answers.map(async (answer) => {
                    return await this.prisma.response.create({
                        data: {
                            questionId: answer.questionId,
                            roundId: dto.roundId,
                            content: answer.answer,
                            timeSpent: answer.timeSpent,
                            submittedAt: new Date()
                        }
                    });
                })
            );

            // Update round completion status and time
            await this.prisma.round.update({
                where: { id: dto.roundId },
                data: {
                    status: 'COMPLETED',
                    timeSpent: dto.totalTimeSpent,
                    completedAt: new Date()
                }
            });

            // Get the first response ID as submission identifier
            const submissionId = responses[0].id;

            // Prepare data for AI verification
            const questionsAndAnswers = await Promise.all(
                dto.answers.map(async (answer) => {
                    const question = round.questions.find(q => q.id === answer.questionId);
                    return {
                        questionId: answer.questionId,
                        question: question!.content,
                        userAnswer: answer.answer,
                        questionType: question!.type,
                        correctAnswer: question!.correctAnswer
                    };
                })
            );

            const aiVerificationPayload: AIVerificationPayload = {
                submissionId,
                roundId: dto.roundId,
                questionsAndAnswers
            };

            // Send to AI backend for verification (fire and forget)
            this.sendToAIVerification(aiVerificationPayload);

            return {
                success: true,
                roundId: dto.roundId,
                submissionId,
                message: 'Answers submitted successfully. AI verification in progress.'
            };

        } catch (error) {
            console.error('Error submitting answers:', error);
            throw new BadRequestException('Failed to submit answers');
        }
    }

    private async sendToAIVerification(payload: AIVerificationPayload): Promise<void> {
        try {
            const aiBackendUrl = this.configService.get<string>('AI_BACKEND_URL');
            const aiBackendToken = this.configService.get<string>('AI_BACKEND_TOKEN');

            await firstValueFrom(
                this.httpService.post(`${aiBackendUrl}/verify-answers`, payload, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${aiBackendToken}`
                    }
                })
            );
        } catch (error) {
            console.error('Error sending to AI verification:', error);
            // Don't throw error as this is fire and forget
        }
    }

    async getRoundQuestions(roundId: string) {
        const round = await this.prisma.round.findUnique({
            where: { id: roundId },
            include: {
                questions: {
                    select: {
                        id: true,
                        content: true,
                        type: true,
                        difficulty: true,
                        category: true,
                        options: true,
                        // Don't include correctAnswer in response
                    }
                }
            }
        });

        if (!round) {
            throw new NotFoundException('Round not found');
        }

        return {
            success: true,
            roundId,
            questions: round.questions,
            totalQuestions: round.questions.length
        };
    }

    async getRoundStatus(roundId: string) {
        const round = await this.prisma.round.findUnique({
            where: { id: roundId },
            select: {
                id: true,
                status: true,
                timeSpent: true,
                startedAt: true,
                completedAt: true,
                duration: true
            }
        });

        if (!round) {
            throw new NotFoundException('Round not found');
        }

        return {
            success: true,
            round
        };
    }
}
