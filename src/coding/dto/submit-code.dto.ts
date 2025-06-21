import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class SubmitCodeDto {
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
}