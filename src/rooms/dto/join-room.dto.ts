import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class JoinRoomDto {
  @ApiProperty({
    description: '6-character room code',
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
    description: 'Player display name',
    minLength: 2,
    maxLength: 30,
    example: 'Taylor',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @Length(2, 30)
  name: string;
}
