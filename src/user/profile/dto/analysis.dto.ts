import { IsArray, IsString, IsInt, IsOptional, Min } from 'class-validator';

export class CreateAnalysisDto {
    @IsString()
    githubUsername: string;

    @IsArray()
    @IsString({ each: true })
    skills: string[];

    @IsString()
    contributionFreq: string;

    @IsInt()
    @Min(0)
    projectsCount: number;

    @IsOptional()
    topLanguages?: Record<string, number>;

    @IsOptional()
    recentActivity?: any;

    @IsOptional()
    repositoryStats?: any;
}

export class AnalysisResponseDto {
    id: string;
    targetRole: string;
    dreamCompanies: string[];
    confidenceScore?: number;
    reasoning?: string;
    skillGaps?: string[];
    careerPath?: string[];
    createdAt: Date;
}