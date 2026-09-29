import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AddQuestionsDto } from './dto/add-questions.dto.js';
import { CreateRoomDto } from './dto/create-room.dto.js';
import { JoinRoomDto } from './dto/join-room.dto.js';
import { QuestionCategory, TimeUnit } from './rooms.service.js';
import { RoomsService } from './rooms.service.js';
import type { RoomRecord } from './rooms.service.js';

@ApiTags('rooms')
@Controller('rooms')
export class RoomsController {

  constructor(private readonly roomsService: RoomsService) {}

  // This is the NestJS version of a Spring @RequestMapping / @GetMapping.
  // The decorator tells NestJS: handle GET requests to /rooms.
  @Get()
  @ApiOperation({ summary: 'List all rooms' })
  @ApiResponse({ status: 200, description: 'Rooms returned successfully.' })
  async getRooms(): Promise<RoomRecord[]> {
    return this.roomsService.listRooms();
  }

  @Get(':code/status')
  @ApiOperation({ summary: 'Get the current room status and remaining countdown time for the frontend' })
  @ApiResponse({ status: 200, description: 'Room status returned successfully.' })
  @ApiParam({ name: 'code', description: '6-character room code', example: 'AB12CD' })
  async getRoomStatus(@Param('code') code: string): Promise<RoomRecord & { reminder?: string; timeRemainingSeconds?: number }> {
    return this.roomsService.checkRoomStatus(code);
  }

  // This is the NestJS equivalent of @PostMapping in Spring Boot.
  // The request body is validated against CreateRoomDto before entering this method.
  @Post()
  @ApiOperation({ summary: 'Create a new room' })
  @ApiResponse({ status: 201, description: 'Room created successfully.' })
  @ApiBody({ type: CreateRoomDto })
  async createRoom(@Body() body: CreateRoomDto): Promise<RoomRecord> {
    return this.roomsService.createRoom(body.name, { maxPlayers: body.maxPlayers, timeLimit: body.timeLimit });
  }

  @Post(':code/questions')
  @ApiOperation({ summary: 'Add questions to an existing room after it is created' })
  @ApiParam({ name: 'code', description: '6-character room code', example: 'AB12CD' })
  @ApiResponse({ status: 201, description: 'Questions added to the room.' })
  @ApiBody({ type: AddQuestionsDto })
  async addQuestionsToRoom(
    @Param('code') code: string,
    @Body() body: AddQuestionsDto,
  ): Promise<RoomRecord> {
    return this.roomsService.addQuestionsToRoom(code, body.questions, { questionCount: body.questionCount });
  }

  @Post('join')
  @ApiOperation({ summary: 'Join an existing room' })
  @ApiResponse({ status: 200, description: 'Player joined the room.' })
  @ApiBody({ type: JoinRoomDto })
  async joinRoom(@Body() body: JoinRoomDto): Promise<RoomRecord> {
    return this.roomsService.joinRoom(body.code, body.name);
  }

  @Post('questions')
  @ApiOperation({ summary: 'Create a reusable question with a category for the room host to reuse later' })
  @ApiResponse({ status: 201, description: 'Question created successfully.' })
  async createQuestion(
    @Body() body: { text: string; category?: QuestionCategory },
  ): Promise<{ id: string; text: string; category: QuestionCategory }> {
    return this.roomsService.createQuestion(body.text, body.category);
  }

  @Post(':code/start')
  @ApiOperation({ summary: 'Start the room even before it reaches the max player count' })
  @ApiResponse({ status: 200, description: 'Room started successfully.' })
  async startRoom(@Param('code') code: string): Promise<RoomRecord> {
    return this.roomsService.startRoom(code);
  }

  @Post(':code/extend-time')
  @ApiOperation({ summary: 'Give the host more time to finish the game before it auto-finishes' })
  @ApiResponse({ status: 200, description: 'Time extended successfully.' })
  async extendTime(
    @Param('code') code: string,
    @Body() body: { amount?: number; timeUnit?: TimeUnit },
  ): Promise<RoomRecord> {
    return this.roomsService.extendTime(code, body.amount ?? 15, body.timeUnit ?? 'SECONDS');
  }

}

