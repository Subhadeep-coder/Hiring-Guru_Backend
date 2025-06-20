import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateUserPreferencesDto {
    @IsString()
    userId: string;

    @IsArray()
    preferredCompanyTypes: string[];

    @IsOptional()
    @IsString()
    difficultyLevel?: string;

    @IsOptional()
    @IsArray()
    preferredTechStack?: string[];
}
