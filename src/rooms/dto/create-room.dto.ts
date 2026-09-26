import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({
    description: 'Display name for the room host. Empty values are allowed and will be normalized.',
    minLength: 0,
    maxLength: 50,
    example: 'Sam',
    required: false,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(0, 50)
  name: string;

  @ApiProperty({
    description: 'Maximum number of players allowed to join this room.',
    minimum: 2,
    maximum: 30,
    example: 8,
    default: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2)
  @Max(30)
  maxPlayers?: number;

  @ApiProperty({
    description: 'How many seconds each question lasts before the room moves on.',
    minimum: 15,
    maximum: 180,
    example: 30,
    default: 30,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(15)
  @Max(180)
  timeLimit?: number;
}
