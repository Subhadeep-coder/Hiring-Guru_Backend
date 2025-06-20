import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum RoundType {
    SCREENING = 'SCREENING',
    APTITUDE = 'APTITUDE',
    COMMUNICATION = 'COMMUNICATION',
    CODING = 'CODING',
    TECHNICAL = 'TECHNICAL',
    BEHAVIORAL = 'BEHAVIORAL',
    SYSTEM_DESIGN = 'SYSTEM_DESIGN',
}

export enum DifficultyLevel {
    EASY = 'EASY',
    MEDIUM = 'MEDIUM',
    HARD = 'HARD',
}

export class CreateCustomRoundDto {
    @IsEnum(RoundType)
    roundType: RoundType;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsInt()
    @Min(1)
    duration: number; // in minutes

    @IsInt()
    @Min(1)
    sequence: number;

    @IsOptional()
    config?: any; // JSON config
}

export class CreateCustomAssessmentDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsEnum(DifficultyLevel)
    difficulty: DifficultyLevel;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateCustomRoundDto)
    rounds: CreateCustomRoundDto[];
}