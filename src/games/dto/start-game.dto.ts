import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class StartGameDto {
  @ApiProperty({
    description: 'The room code to start the game for',
    pattern: '^[A-Z2-9]{6}$',
    example: 'AB12CD',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  @Matches(/^[A-Z2-9]{6}$/)
  roomCode: string;
}
