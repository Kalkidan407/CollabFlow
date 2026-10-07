import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AddSpecificationQuestionsDto {
  @ApiProperty({
    description: 'Questions or prompts the team wants to add to the specification review.',
    type: [String],
    example: ['What problem are we solving?', 'Which APIs are in scope?'],
    minItems: 1,
    maxItems: 20,
  })
  @Transform(({ value }) => {
    if (Array.isArray(value)) {
      return value.map((question) => (typeof question === 'string' ? question.trim() : question));
    }
    return value;
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  questions: string[];

  @ApiPropertyOptional({
    description: 'How many specification questions should be used for review.',
    minimum: 1,
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  questionCount?: number;
}
