import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
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

    async createAnalysis(createAnalysisDto: CreateAnalysisDto, userId: string): Promise<AnalysisResponseDto> {
        const { githubUsername } = createAnalysisDto;

        if (!githubUsername) {
            throw new BadRequestException('GitHub username is required');
        }

        try {
            // Prepare data for AI backend
            const aiPayload = {
                skills: createAnalysisDto.skills,
                contributionFreq: createAnalysisDto.contributionFreq,
                projectsCount: createAnalysisDto.projectsCount,
                topLanguages: createAnalysisDto.topLanguages,
                recentActivity: createAnalysisDto.recentActivity,
                repositoryStats: createAnalysisDto.repositoryStats,
                targetRole: createAnalysisDto.targetRole,
                dreamCompanies: createAnalysisDto.dreamCompanies,
            };

            // Send data to AI backend
            const aiResponse = await this.aiService.analyzeProfile(aiPayload);

            // Store analysis result in database
            const analysis = await this.prisma.userAnalysis.create({
                data: {
                    userId: userId,
                    skills: createAnalysisDto.skills,
                    contributionFreq: createAnalysisDto.contributionFreq,
                    projectsCount: createAnalysisDto.projectsCount,
                    topLanguages: createAnalysisDto.topLanguages,
                    recentActivity: createAnalysisDto.recentActivity,
                    repositoryStats: createAnalysisDto.repositoryStats,
                    targetRole: createAnalysisDto.targetRole,
                    dreamCompanies: createAnalysisDto.dreamCompanies,
                    skillGaps: aiResponse.skillGaps || [],
                    careerPath: aiResponse.careerPath || [],
                },
            });

            await this.prisma.user.update({
                where: {
                    id: userId,
                },
                data: {
                    isCompleted: true
                }
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
        } catch (error) {
            if (error instanceof ConflictException || error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException('Failed to create analysis: ' + error.message);
        }
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

    async getAnalysisById(id: string): Promise<AnalysisResponseDto> {
        const analysis = await this.prisma.userAnalysis.findUnique({
            where: { id },
        });

        if (!analysis) {
            throw new NotFoundException('Analysis not found');
        }

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

    async getGithubData(githubUsername: string) {
        if (!githubUsername) {
            throw new BadRequestException('GitHub username is required');
        }

        try {
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

            // Calculate recent activity
            const recentActivity = {
                lastPushDate: repositories.reduce((latest, repo) => {
                    const pushDate = new Date(repo.pushed_at);
                    return pushDate > latest ? pushDate : latest;
                }, new Date(0)),
                activeRepos: repositories.filter(repo => {
                    const lastPush = new Date(repo.pushed_at);
                    const sixMonthsAgo = new Date();
                    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                    return lastPush > sixMonthsAgo;
                }).length,
            };

            return {
                profile,
                skills,
                contributionFreq,
                projectsCount: profile.public_repos,
                topLanguages: languages,
                recentActivity,
                repositoryStats: {
                    totalStars: repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0),
                    totalForks: repositories.reduce((sum, repo) => sum + repo.forks_count, 0),
                    totalSize: repositories.reduce((sum, repo) => sum + repo.size, 0),
                    averageStars: repositories.length > 0
                        ? repositories.reduce((sum, repo) => sum + repo.stargazers_count, 0) / repositories.length
                        : 0,
                },
            };
        } catch (error) {
            throw new BadRequestException('Failed to fetch GitHub data: ' + error.message);
        }
    }
}