import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';

export class CreateWorkspaceDto {
  @ApiProperty({
    description: 'Display name for the workspace owner. Empty values are allowed and will be normalized.',
    minLength: 0,
    maxLength: 50,
    example: 'Sam',
    required: false,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(0, 50)
  name: string;
}
