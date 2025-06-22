import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';

@Injectable()
export class PredefinedAssessmentService {
    constructor(private prisma: PrismaService) { }

    async getPredefinedAssessments() {
        return this.prisma.predefinedAssessment.findMany({
            where: { isActive: true },
            include: {
                rounds: {
                    orderBy: { sequence: 'asc' },
                },
            },
            orderBy: { name: 'asc' },
        });
    }

    async getPredefinedAssessmentById(assessmentId: string) {
        return this.prisma.predefinedAssessment.findFirst({
            where: {
                id: assessmentId,
                isActive: true,
            },
            include: {
                rounds: {
                    orderBy: { sequence: 'asc' },
                },
            },
        });
    }
}