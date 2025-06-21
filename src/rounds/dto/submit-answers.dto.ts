import { IsString, IsArray, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AnswerDto {
  @IsString()
  questionId: string;

  @IsString()
  answer: string; 

  @IsNumber()
  timeSpent: number;
}



export class SubmitAnswersDto {
    @IsString()
    roundId: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AnswerDto)
    answers: AnswerDto[];

    @IsNumber()
    totalTimeSpent: number;
}