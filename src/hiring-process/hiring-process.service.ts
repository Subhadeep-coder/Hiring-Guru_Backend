import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { StartHiringProcessDto } from './dto/start-hiring-process.dto';

@Injectable()
export class HiringProcessService {
    constructor(private prisma: PrismaService) { }

    async startHiringProcess(userId: string, dto: StartHiringProcessDto) {
        // Validate assessment exists based on type
        let assessment: any;
        let assessmentData: any;

        if (dto.assessmentType === 'PREDEFINED') {
            if (!dto.predefinedAssessmentId) {
                throw new BadRequestException('Predefined assessment ID is required');
            }

            assessment = await this.prisma.predefinedAssessment.findFirst({
                where: {
                    id: dto.predefinedAssessmentId,
                    isActive: true,
                },
                include: {
                    rounds: {
                        orderBy: { sequence: 'asc' },
                    },
                },
            });

            if (!assessment) {
                throw new NotFoundException('Predefined assessment not found or inactive');
            }

            assessmentData = {
                predefinedAssessmentId: dto.predefinedAssessmentId,
            };
        } else {
            if (!dto.customAssessmentId) {
                throw new BadRequestException('Custom assessment ID is required');
            }

            assessment = await this.prisma.customAssessment.findFirst({
                where: {
                    id: dto.customAssessmentId,
                    userId, // Ensure user owns this custom assessment
                },
                include: {
                    rounds: {
                        orderBy: { sequence: 'asc' },
                    },
                },
            });

            if (!assessment) {
                throw new NotFoundException('Custom assessment not found or you do not have access');
            }

            assessmentData = {
                customAssessmentId: dto.customAssessmentId,
            };
        }

        // Check if user has any active hiring process
        const activeProcess = await this.prisma.hiringProcess.findFirst({
            where: {
                userId,
                status: 'IN_PROGRESS',
            },
        });

        if (activeProcess) {
            throw new ForbiddenException('You already have an active hiring process. Complete it before starting a new one.');
        }

        // Create configuration snapshot
        const configSnapshot = {
            assessmentType: dto.assessmentType,
            assessmentName: assessment.name,
            totalDuration: assessment.totalDuration,
            roundCount: assessment.roundCount,
            rounds: assessment.rounds.map(round => ({
                id: round.id,
                roundType: round.roundType,
                name: round.name,
                description: round.description,
                duration: round.duration,
                sequence: round.sequence,
                config: round.config,
            })),
            snapshotTakenAt: new Date(),
        };

        // Create hiring process with rounds
        const hiringProcess = await this.prisma.hiringProcess.create({
            data: {
                userId,
                assessmentType: dto.assessmentType,
                ...assessmentData,
                status: 'IN_PROGRESS',
                isLocked: true,
                lockedAt: new Date(),
                startedAt: new Date(),
                configSnapshot,
                rounds: {
                    create: assessment.rounds.map(round => ({
                        roundType: round.roundType,
                        name: round.name,
                        description: round.description,
                        sequence: round.sequence,
                        duration: round.duration,
                        status: 'NOT_STARTED',
                        ...(dto.assessmentType === 'PREDEFINED'
                            ? { predefinedRoundId: round.id }
                            : { customRoundId: round.id }
                        ),
                    })),
                },
            },
            include: {
                rounds: {
                    orderBy: { sequence: 'asc' },
                },
                predefinedAssessment: true,
                customAssessment: true,
            },
        });

        return hiringProcess;
    }

    async getUserHiringProcesses(userId: string) {
        return this.prisma.hiringProcess.findMany({
            where: { userId },
            include: {
                predefinedAssessment: {
                    select: {
                        id: true,
                        name: true,
                        difficulty: true,
                        totalDuration: true,
                        roundCount: true,
                    },
                },
                customAssessment: {
                    select: {
                        id: true,
                        name: true,
                        difficulty: true,
                        totalDuration: true,
                        roundCount: true,
                    },
                },
                rounds: {
                    select: {
                        id: true,
                        roundType: true,
                        name: true,
                        status: true,
                        sequence: true,
                    },
                    orderBy: { sequence: 'asc' },
                },
                finalAssessment: {
                    select: {
                        overallScore: true,
                        hiringDecision: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getHiringProcessById(userId: string, processId: string) {
        const process = await this.prisma.hiringProcess.findFirst({
            where: {
                id: processId,
                userId,
            },
            include: {
                rounds: {
                    orderBy: { sequence: 'asc' },
                },
                predefinedAssessment: true,
                customAssessment: true,
                finalAssessment: true,
            },
        });

        if (!process) {
            throw new NotFoundException('Hiring process not found');
        }

        return process;
    }
}