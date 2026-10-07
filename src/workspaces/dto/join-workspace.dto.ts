import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class JoinWorkspaceDto {
  @ApiProperty({
    description: 'Workspace share code or identifier.',
    pattern: '^[A-Z2-9]{6}$',
    example: 'AB12CD',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  @Matches(/^[A-Z2-9]{6}$/)
  code: string;

  @ApiProperty({
    description: 'Member display name. Empty values are allowed and will be normalized.',
    minLength: 0,
    maxLength: 50,
    example: 'Taylor',
    required: false,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(0, 50)
  name: string;
}
