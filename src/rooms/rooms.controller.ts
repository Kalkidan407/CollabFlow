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

  @Get()
  @ApiOperation({ summary: 'List all rooms' })
  @ApiResponse({ status: 200, description: 'Rooms returned successfully.' })
  async getRooms(): Promise<RoomRecord[]> {
    return this.roomsService.listRooms();
  }

  @Get(':code/status')
  @ApiOperation({ summary: 'Get the current room status and project progress context' })
  @ApiResponse({ status: 200, description: 'Room status returned successfully.' })
  @ApiParam({ name: 'code', description: 'Project room code', example: 'AB12CD' })
  async getRoomStatus(@Param('code') code: string): Promise<RoomRecord & { reminder?: string; timeRemainingSeconds?: number }> {
    return this.roomsService.checkRoomStatus(code);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new project room' })
  @ApiResponse({ status: 201, description: 'Project room created successfully.' })
  @ApiBody({ type: CreateRoomDto })
  async createRoom(@Body() body: CreateRoomDto): Promise<RoomRecord> {
    return this.roomsService.createRoom(body.name, { maxPlayers: body.maxPlayers, timeLimit: body.timeLimit });
  }

  @Post('project')
  @ApiOperation({ summary: 'Create a project room for a final-year student team' })
  @ApiResponse({ status: 201, description: 'Project room created successfully.' })
  @ApiBody({
    schema: {
      example: {
        title: 'Smart Campus Transportation System',
        description: 'A route-planning platform for student mobility',
        teamSize: 5,
        academicYear: '2026/27',
        advisorName: 'Dr. Abebe',
        advisorEmail: 'abebe@university.edu',
        hostName: 'Alem',
      },
    },
  })
  async createProjectRoom(@Body() body: any): Promise<RoomRecord> {
    return this.roomsService.createProjectRoom(body);
  }

  @Post(':code/invite')
  @ApiOperation({ summary: 'Invite a new member to the project room' })
  @ApiParam({ name: 'code', description: 'Project room code', example: 'AB12CD' })
  @ApiResponse({ status: 200, description: 'Member invited successfully.' })
  async inviteMember(@Param('code') code: string, @Body() body: any): Promise<RoomRecord> {
    return this.roomsService.inviteMember(code, body);
  }

  @Post(':code/ideas')
  @ApiOperation({ summary: 'Submit a project idea inside the room' })
  @ApiParam({ name: 'code', description: 'Project room code', example: 'AB12CD' })
  @ApiResponse({ status: 201, description: 'Idea submitted successfully.' })
  async submitIdea(@Param('code') code: string, @Body() body: any) {
    return this.roomsService.submitIdea(code, body);
  }

  @Post(':code/ideas/:ideaId/vote')
  @ApiOperation({ summary: 'Vote on an idea in the room' })
  @ApiParam({ name: 'code', description: 'Project room code', example: 'AB12CD' })
  @ApiParam({ name: 'ideaId', description: 'Idea ID' })
  @ApiResponse({ status: 200, description: 'Vote submitted successfully.' })
  async voteOnIdea(@Param('code') code: string, @Param('ideaId') ideaId: string, @Body('voterName') voterName: string) {
    return this.roomsService.voteOnIdea(code, ideaId, voterName);
  }

  @Post(':code/requirements')
  @ApiOperation({ summary: 'Add requirements, user stories, and acceptance criteria to the room' })
  @ApiParam({ name: 'code', description: 'Project room code', example: 'AB12CD' })
  @ApiResponse({ status: 201, description: 'Requirement added successfully.' })
  async addRequirement(@Param('code') code: string, @Body() body: any) {
    return this.roomsService.addRequirement(code, body);
  }

  @Post(':code/sprints')
  @ApiOperation({ summary: 'Create a sprint for project execution inside the room' })
  @ApiParam({ name: 'code', description: 'Project room code', example: 'AB12CD' })
  @ApiResponse({ status: 201, description: 'Sprint created successfully.' })
  async createSprint(@Param('code') code: string, @Body() body: any) {
    return this.roomsService.createSprint(code, body);
  }

  @Post(':code/tasks')
  @ApiOperation({ summary: 'Create tasks for the room and assign them to a member' })
  @ApiParam({ name: 'code', description: 'Project room code', example: 'AB12CD' })
  @ApiResponse({ status: 201, description: 'Task created successfully.' })
  async createTask(@Param('code') code: string, @Body() body: any) {
    return this.roomsService.createTask(code, body);
  }

  @Post(':code/reviews')
  @ApiOperation({ summary: 'Submit advisor review comments and approval inside the room' })
  @ApiParam({ name: 'code', description: 'Project room code', example: 'AB12CD' })
  @ApiResponse({ status: 201, description: 'Advisor review submitted successfully.' })
  async submitAdvisorReview(@Param('code') code: string, @Body() body: any) {
    return this.roomsService.submitAdvisorReview(code, body);
  }

  @Get(':code/documentation')
  @ApiOperation({ summary: 'Generate a structured project documentation draft based on the room history' })
  @ApiParam({ name: 'code', description: 'Project room code', example: 'AB12CD' })
  @ApiResponse({ status: 200, description: 'Documentation draft generated successfully.' })
  async generateRoomDocumentation(@Param('code') code: string) {
    return this.roomsService.generateRoomDocumentation(code);
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
  @ApiOperation({ summary: 'Give the host more time to finish the room before it auto-finishes' })
  @ApiResponse({ status: 200, description: 'Time extended successfully.' })
  async extendTime(
    @Param('code') code: string,
    @Body() body: { amount?: number; timeUnit?: TimeUnit },
  ): Promise<RoomRecord> {
    return this.roomsService.extendTime(code, body.amount ?? 15, body.timeUnit ?? 'SECONDS');
  }
}

