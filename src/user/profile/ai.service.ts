import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface AIAnalysisRequest {
    skills: string[];
    contributionFreq: string;
    projectsCount: number;
    topLanguages?: Record<string, number>;
}

interface AIAnalysisResponse {
    targetRole: string;
    dreamCompanies: string[];
    confidenceScore?: number;
    reasoning?: string;
    skillGaps?: string[];
    careerPath?: string[];
}

@Injectable()
export class AIService {
    constructor(
        private readonly httpService: HttpService,
        private readonly configService: ConfigService,
    ) { }

    async analyzeProfile(data: AIAnalysisRequest): Promise<AIAnalysisResponse> {
        try {
            const aiBackendUrl = this.configService.get<string>('AI_BACKEND_URL');

            const response = await firstValueFrom(
                this.httpService.post(`${aiBackendUrl}/analyze`, data, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${this.configService.get<string>('AI_API_KEY')}`,
                    },
                    timeout: 30000, // 30 seconds timeout
                }),
            );

            return response.data;
        } catch (error) {
            // Fallback response if AI service is unavailable
            return this.generateFallbackAnalysis(data);
        }
    }

    private generateFallbackAnalysis(data: AIAnalysisRequest): AIAnalysisResponse {
        // Simple fallback logic based on skills and project count
        const { skills, projectsCount, contributionFreq } = data;

        let targetRole = 'Software Developer';
        const dreamCompanies = ['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple'];

        // Basic role determination logic
        if (skills.some(skill => ['React', 'Vue', 'Angular', 'JavaScript', 'TypeScript'].includes(skill))) {
            targetRole = 'Frontend Developer';
        } else if (skills.some(skill => ['Node.js', 'Python', 'Java', 'Go', 'Rust'].includes(skill))) {
            targetRole = 'Backend Developer';
        } else if (skills.some(skill => ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn'].includes(skill))) {
            targetRole = 'Machine Learning Engineer';
        } else if (skills.some(skill => ['AWS', 'Docker', 'Kubernetes', 'DevOps'].includes(skill))) {
            targetRole = 'DevOps Engineer';
        }

        return {
            targetRole,
            dreamCompanies: dreamCompanies.slice(0, 3), // Return top 3
            confidenceScore: 0.7,
            reasoning: 'Generated based on detected skills and project activity',
            skillGaps: ['System Design', 'Advanced Algorithms'],
            careerPath: [`Junior ${targetRole}`, `Senior ${targetRole}`, `Lead ${targetRole}`],
        };
    }
}