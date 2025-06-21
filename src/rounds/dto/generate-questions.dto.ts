import { IsString, IsEnum, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class GenerateQuestionsDto {
    @IsString()
    roundId: string;

    @IsEnum(['APTITUDE', 'TECHNICAL', 'BEHAVIORAL'])
    roundType: 'APTITUDE' | 'TECHNICAL' | 'BEHAVIORAL';

    @IsEnum(['easy', 'medium', 'hard'])
    difficulty: 'easy' | 'medium' | 'hard';

    @IsNumber()
    @Min(1)
    @Max(50)
    questionCount: number;

    @IsOptional()
    @IsString()
    category?: string;

    @IsNumber()
    @Min(1)
    duration: number;
}