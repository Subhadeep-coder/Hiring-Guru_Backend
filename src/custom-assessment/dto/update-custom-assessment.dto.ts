import { PartialType } from '@nestjs/mapped-types';
import { CreateCustomAssessmentDto } from './create-custom-assessment.dto';

export class UpdateCustomAssessmentDto extends PartialType(CreateCustomAssessmentDto) { }