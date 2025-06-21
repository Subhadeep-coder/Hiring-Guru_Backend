import { IsString, IsNotEmpty, IsArray, IsOptional, IsNumber } from 'class-validator';

export class RunCodeDto {
    @IsString()
    @IsNotEmpty()
    code: string;

    @IsString()
    @IsNotEmpty()
    language: string;

    @IsString()
    @IsNotEmpty()
    roundId: string;

    @IsString()
    @IsNotEmpty()
    questionId: string;

    @IsArray()
    @IsOptional()
    testCases?: any[];

    @IsString()
    @IsOptional()
    stdin?: string;
}