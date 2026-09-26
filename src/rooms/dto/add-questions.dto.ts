import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AddQuestionsDto {
  @ApiProperty({
    description: 'Questions the host wants to add to the room.',
    type: [String],
    example: ['Who would win?', 'Who is most likely to be late?'],
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
    description: 'How many questions should be used when the game starts. This value is capped only by the actual number of questions already added to the room.',
    minimum: 1,
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  questionCount?: number;
}
