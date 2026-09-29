import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export enum TimeUnitEnum {
  SECONDS = 'SECONDS',
  MINUTES = 'MINUTES',
  HOURS = 'HOURS',
  DAYS = 'DAYS',
}

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
    description: 'How much time the room gets before auto-finish. The value is converted from the selected unit into seconds internally.',
    minimum: 1,
    example: 30,
    default: 30,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  timeLimit?: number;

  @ApiProperty({
    description: 'Unit used for the room time limit. Frontend can select seconds, minutes, hours, or days.',
    enum: TimeUnitEnum,
    example: 'MINUTES',
    default: 'SECONDS',
    required: false,
  })
  @IsOptional()
  @IsEnum(TimeUnitEnum)
  timeUnit?: TimeUnitEnum;
}
