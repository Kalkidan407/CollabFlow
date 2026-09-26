import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateRoomDto } from './dto/create-room.dto.js';
import { JoinRoomDto } from './dto/join-room.dto.js';
import { RoomsService } from './rooms.service.js';
import type { RoomRecord } from './rooms.service.js';

@ApiTags('rooms')
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Get()
  @ApiOperation({ summary: 'List all rooms' })
  @ApiResponse({ status: 200, description: 'Rooms returned successfully.' })
  async getRooms(): Promise<RoomRecord[]> {
    return this.roomsService.listRooms();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new room' })
  @ApiResponse({ status: 201, description: 'Room created successfully.' })
  @ApiBody({ type: CreateRoomDto })
  async createRoom(@Body() body: CreateRoomDto): Promise<RoomRecord> {
    return this.roomsService.createRoom(body.name);
  }

  @Post('join')
  @ApiOperation({ summary: 'Join an existing room' })
  @ApiResponse({ status: 200, description: 'Player joined the room.' })
  @ApiBody({ type: JoinRoomDto })
  async joinRoom(@Body() body: JoinRoomDto): Promise<RoomRecord> {
    return this.roomsService.joinRoom(body.code, body.name);
  }
}

