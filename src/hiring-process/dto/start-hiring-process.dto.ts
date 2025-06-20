import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum AssessmentType {
    PREDEFINED = 'PREDEFINED',
    CUSTOM = 'CUSTOM',
}

export class StartHiringProcessDto {
    @IsEnum(AssessmentType)
    assessmentType: AssessmentType;

    @IsOptional()
    @IsString()
    predefinedAssessmentId?: string;

    @IsOptional()
    @IsString()
    customAssessmentId?: string;
}