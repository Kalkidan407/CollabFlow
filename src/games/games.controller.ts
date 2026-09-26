import { Body, Controller, Param, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StartGameDto } from './dto/start-game.dto.js';
import { GamesService, type GameState } from './games.service.js';

@ApiTags('games')
@Controller('games')
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  @Post('start/:roomCode')
  @ApiOperation({ summary: 'Start a game using the room code in the URL' })
  @ApiParam({ name: 'roomCode', description: '6-character room code', example: 'AB12CD' })
  @ApiResponse({ status: 201, description: 'Game started successfully.' })
  async startGame(@Param('roomCode') roomCode: string): Promise<GameState> {
    return this.gamesService.startGame(roomCode);
  }

  @Post('start')
  @ApiOperation({ summary: 'Start a game using a JSON body' })
  @ApiResponse({ status: 201, description: 'Game started successfully.' })
  @ApiBody({ type: StartGameDto })
  async startGameFromBody(@Body() body: StartGameDto): Promise<GameState> {
    return this.gamesService.startGame(body.roomCode);
  }
}
