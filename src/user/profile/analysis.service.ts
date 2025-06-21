import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { AIService } from './ai.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { GithubApiService } from './github-api.service';
import { AnalysisResponseDto, CreateAnalysisDto } from './dto/analysis.dto';

@Injectable()
export class AnalysisService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly githubService: GithubApiService,
        private readonly aiService: AIService,
    ) { }

    async createAnalysis(createAnalysisDto: CreateAnalysisDto): Promise<AnalysisResponseDto> {
        const { githubUsername } = createAnalysisDto;

        // Get or create user - handle GitHub username uniqueness
        const githubProfile = await this.githubService.getUserProfile(githubUsername);

        let user = await this.findUserByGithubUsername(githubUsername);

        if (!user) {
            // Check if GitHub username already exists (only if not null)
            if (githubUsername) {
                const existingUser = await this.prisma.user.findFirst({
                    where: {
                        githubUsername: githubUsername,
                    },
                });

                if (existingUser) {
                    throw new ConflictException('GitHub username already exists');
                }
            }

            user = await this.prisma.user.create({
                data: {
                    email: githubProfile.email || `${githubUsername}@github.local`, // Fallback email
                    githubUsername,
                    name: githubProfile.name,
                    avatar: githubProfile.avatar_url,
                    authProvider: 'github',
                    authProviderId: githubProfile.id.toString(),
                },
            });
        }

        // Send data to AI backend
        const aiResponse = await this.aiService.analyzeProfile({
            skills: createAnalysisDto.skills,
            contributionFreq: createAnalysisDto.contributionFreq,
            projectsCount: createAnalysisDto.projectsCount,
            topLanguages: createAnalysisDto.topLanguages,
        });

        // Store analysis result
        const analysis = await this.prisma.userAnalysis.create({
            data: {
                userId: user.id,
                skills: createAnalysisDto.skills,
                contributionFreq: createAnalysisDto.contributionFreq,
                projectsCount: createAnalysisDto.projectsCount,
                topLanguages: createAnalysisDto.topLanguages,
                recentActivity: createAnalysisDto.recentActivity,
                repositoryStats: createAnalysisDto.repositoryStats,
                targetRole: aiResponse.targetRole,
                dreamCompanies: aiResponse.dreamCompanies,
                confidenceScore: aiResponse.confidenceScore,
                reasoning: aiResponse.reasoning,
                skillGaps: aiResponse.skillGaps,
                careerPath: aiResponse.careerPath,
            },
        });

        return {
            id: analysis.id,
            targetRole: analysis.targetRole,
            dreamCompanies: analysis.dreamCompanies,
            confidenceScore: analysis.confidenceScore!,
            reasoning: analysis.reasoning!,
            skillGaps: analysis.skillGaps,
            careerPath: analysis.careerPath,
            createdAt: analysis.createdAt,
        };
    }

    private async findUserByGithubUsername(githubUsername: string) {
        if (!githubUsername) return null;

        return await this.prisma.user.findFirst({
            where: {
                githubUsername: githubUsername,
            },
        });
    }

    async getAnalysisByUser(githubUsername: string) {
        const user = await this.findUserByGithubUsername(githubUsername);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const analyses = await this.prisma.userAnalysis.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 10, // Get last 10 analyses
        });

        return analyses.map(analysis => ({
            id: analysis.id,
            targetRole: analysis.targetRole,
            dreamCompanies: analysis.dreamCompanies,
            confidenceScore: analysis.confidenceScore,
            reasoning: analysis.reasoning,
            skillGaps: analysis.skillGaps,
            careerPath: analysis.careerPath,
            createdAt: analysis.createdAt,
        }));
    }

    async getGithubData(githubUsername: string) {
        const [profile, repositories, languages, contributionFreq] = await Promise.all([
            this.githubService.getUserProfile(githubUsername),
            this.githubService.getUserRepositories(githubUsername),
            this.githubService.getUserLanguages(githubUsername),
            this.githubService.getContributionFrequency(githubUsername),
        ]);

        // Extract skills from languages and repository topics
        const skills = [
            ...Object.keys(languages),
            ...repositories.flatMap(repo => repo.topics || []),
        ].filter((skill, index, arr) => arr.indexOf(skill) === index); // Remove duplicates

        return {
            profile,
            skills,
            contributionFreq,
            projectsCount: profile.public_repos,
            topLanguages: languages,
            repositoryStats: {
                totalStars: repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0),
                totalForks: repositories.reduce((sum, repo) => sum + repo.forks_count, 0),
                totalSize: repositories.reduce((sum, repo) => sum + repo.size, 0),
            },
        };
    }
}