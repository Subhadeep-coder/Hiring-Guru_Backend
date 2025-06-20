import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateCustomAssessmentDto } from './dto/create-custom-assessment.dto';
import { UpdateCustomAssessmentDto } from './dto/update-custom-assessment.dto';

@Injectable()
export class CustomAssessmentService {
    constructor(private prisma: PrismaService) { }

    async createCustomAssessment(userId: string, dto: CreateCustomAssessmentDto) {
        // Calculate total duration and round count
        const totalDuration = dto.rounds.reduce((sum, round) => sum + round.duration, 0);
        const roundCount = dto.rounds.length;

        // Validate sequence numbers are consecutive starting from 1
        const sequences = dto.rounds.map(r => r.sequence).sort((a, b) => a - b);
        const expectedSequences = Array.from({ length: roundCount }, (_, i) => i + 1);

        if (JSON.stringify(sequences) !== JSON.stringify(expectedSequences)) {
            throw new ForbiddenException('Round sequences must be consecutive starting from 1');
        }

        // Create the custom assessment with rounds
        const customAssessment = await this.prisma.customAssessment.create({
            data: {
                userId,
                name: dto.name,
                description: dto.description,
                difficulty: dto.difficulty,
                totalDuration,
                roundCount,
                rounds: {
                    create: dto.rounds.map(round => ({
                        roundType: round.roundType,
                        name: round.name,
                        description: round.description,
                        duration: round.duration,
                        sequence: round.sequence,
                        config: round.config,
                    })),
                },
            },
            include: {
                rounds: {
                    orderBy: { sequence: 'asc' },
                },
            },
        });

        return customAssessment;
    }

    async updateCustomAssessment(userId: string, assessmentId: string, dto: UpdateCustomAssessmentDto) {
        // Check if assessment exists and belongs to user
        const existingAssessment = await this.prisma.customAssessment.findFirst({
            where: {
                id: assessmentId,
                userId,
            },
            include: {
                hiringProcesses: {
                    where: {
                        status: { in: ['IN_PROGRESS', 'COMPLETED'] },
                    },
                    select: { id: true },
                },
            },
        });

        if (!existingAssessment) {
            throw new NotFoundException('Custom assessment not found');
        }

        // Prevent update if assessment is being used in active processes
        if (existingAssessment.hiringProcesses.length > 0) {
            throw new ForbiddenException('Cannot update assessment that is being used in active hiring processes');
        }

        // Calculate new totals if rounds are being updated
        let totalDuration = existingAssessment.totalDuration;
        let roundCount = existingAssessment.roundCount;

        if (dto.rounds) {
            totalDuration = dto.rounds.reduce((sum, round) => sum + round.duration, 0);
            roundCount = dto.rounds.length;

            // Validate sequence numbers
            const sequences = dto.rounds.map(r => r.sequence).sort((a, b) => a - b);
            const expectedSequences = Array.from({ length: roundCount }, (_, i) => i + 1);

            if (JSON.stringify(sequences) !== JSON.stringify(expectedSequences)) {
                throw new ForbiddenException('Round sequences must be consecutive starting from 1');
            }
        }

        // Update the assessment
        const updatedAssessment = await this.prisma.customAssessment.update({
            where: { id: assessmentId },
            data: {
                name: dto.name,
                description: dto.description,
                difficulty: dto.difficulty,
                totalDuration,
                roundCount,
                ...(dto.rounds && {
                    rounds: {
                        deleteMany: {}, // Delete existing rounds
                        create: dto.rounds.map(round => ({
                            roundType: round.roundType,
                            name: round.name,
                            description: round.description,
                            duration: round.duration,
                            sequence: round.sequence,
                            config: round.config,
                        })),
                    },
                }),
            },
            include: {
                rounds: {
                    orderBy: { sequence: 'asc' },
                },
            },
        });

        return updatedAssessment;
    }

    async getUserCustomAssessments(userId: string) {
        return this.prisma.customAssessment.findMany({
            where: { userId },
            include: {
                rounds: {
                    orderBy: { sequence: 'asc' },
                },
                _count: {
                    select: {
                        hiringProcesses: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getCustomAssessmentById(userId: string, assessmentId: string) {
        const assessment = await this.prisma.customAssessment.findFirst({
            where: {
                id: assessmentId,
                userId,
            },
            include: {
                rounds: {
                    orderBy: { sequence: 'asc' },
                },
            },
        });

        if (!assessment) {
            throw new NotFoundException('Custom assessment not found');
        }

        return assessment;
    }
}