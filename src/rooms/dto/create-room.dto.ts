import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({
    description: 'Display name for the room host',
    minLength: 2,
    maxLength: 30,
    example: 'Sam',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @Length(2, 30)
  name: string;
}
