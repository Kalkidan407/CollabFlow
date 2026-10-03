import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export type RoomStatus = 'WAITING' | 'IDEATION' | 'IN_PROGRESS' | 'APPROVED' | 'FINISHED';


export interface RoomMember {
  id: string;
  name: string;
  isHost: boolean;
  joinedAt: string;
}

export interface RoomRecord {
  id: string;
  code: string;
  title: string;
  description?: string;
  status: RoomStatus;
  timeRemainingSeconds?: number;
  questionCount: number;
  currentQuestionIndex: number;
  academicYear?: string;
  advisorName?: string;
  advisorEmail?: string;
  createdAt: string;
  updatedAt: string;
  members: RoomMember[];
}

export interface ProjectRoomInput {
  title: string;
  description?: string;
  teamSize?: number;
  academicYear: string;
  advisorName?: string;
  advisorEmail?: string;
  hostName: string;
}

export interface InviteMemberInput {
  name: string;
  email?: string;
  role?: string;
}

export interface RoomIdeaInput {
  submittedBy: string;
  problem: string;
  solution: string;
  stakeholders: string[];
  targetUsers: string[];
  description?: string;
}

export interface RoomRequirementInput {
  title: string;
  description: string;
  userStories: string[];
  acceptanceCriteria: string[];
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  type?: 'FUNCTIONAL' | 'NON_FUNCTIONAL';
}

export interface RoomSprintInput {
  name: string;
  goal?: string;
  startDate?: string;
  endDate?: string;
  status?: 'PLANNED' | 'ACTIVE' | 'COMPLETED';
}

export interface RoomTaskInput {
  sprintId?: string;
  title: string;
  description?: string;
  assignee?: string;
  status?: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface RoomReviewInput {
  advisorName: string;
  advisorEmail?: string;
  comments?: string;
  suggestions?: string;
  status?: 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED';
}

@Injectable()
export class RoomsService {

  constructor(private readonly prisma: PrismaService) {}

  async listRooms(): Promise<RoomRecord[]> {
    const db = this.prisma.getClient();
    const rooms = await db.orm.public.Room.all();

    return Promise.all(
      rooms.map(async (room: any) => {
        const players = await db.orm.public.Player.where({ roomId: room.id }).all();
        return this.mapRoom(room, players);
      }),
    );
  }



  async createProjectRoom(data: ProjectRoomInput): Promise<RoomRecord> {

    const db = this.prisma.getClient();
    const code = await this.generateUniqueRoomCode(db);
    const safeHostName = this.normalizeDisplayName(data.hostName, 'Host');
    const title = this.normalizeText(data.title, 'Untitled Project');
    const description = this.normalizeText(data.description, 'Project workspace created for team collaboration.');
    const academicYear = this.normalizeText(data.academicYear, '2026/27');
    const advisorName = this.normalizeText(data.advisorName, 'Advisor');
    const advisorEmail = this.normalizeText(data.advisorEmail, '');

    const room = await db.orm.public.Room.create({
      code,
      title,
      description,
      status: 'IDEATION',
      academicYear,
      advisorName,
      advisorEmail,
      teamSize: this.normalizeMaxPlayers(data.teamSize ?? 5),
     
    });

    await db.orm.public.Player.create({
      roomId: room.id,
      name: safeHostName,
      isHost: true,
    });

    const fullRoom = await db.orm.public.Room.where({ id: room.id }).first();
    const players = await db.orm.public.Player.where({ roomId: room.id }).all();
    return this.mapRoom(fullRoom!, players);

  }

  async inviteMember(code: string, newMember: InviteMemberInput): Promise<RoomRecord> {
    const db = this.prisma.getClient();
    const room = await db.orm.public.Room.where({ code: code.toUpperCase() }).first();

    if (!room) {
      throw new NotFoundException(`Room ${code} was not found.`);
    }

    const member = await db.orm.public.Member.where({ roomId: room.id }).all();
    const safeName = this.normalizeDisplayName(newMember.name, 'Member');
    const safeRole = this.normalizeText(newMember.role, 'Member');
    const safeEmail = typeof newMember.email === 'string' ? newMember.email.trim() : undefined;

    const existingMember = (member as any[]).find(
      (newMember: any) => newMember.name === safeName || newMember.email === safeEmail,
    );
    if (!existingMember) {
      await db.orm.public.Player.create({
        roomId: room.id,
        name: safeName,
        email: safeEmail,
        role: safeRole,
        isHost: false,
      });
    }

    const updatedPlayers = await db.orm.public.Player.where({ roomId: room.id }).all();
    return this.mapRoom(room, updatedPlayers);
  }

  async submitIdea(code: string, idea: RoomIdeaInput) {
    const db = this.prisma.getClient();
    const room = await db.orm.public.Room.where({ code: code.toUpperCase() }).first();

    if (!room) {
      throw new NotFoundException(`Room ${code} was not found.`);
    }

    const ideaRecord = await db.orm.public.RoomIdea.create({
      roomId: room.id,
      submittedBy: idea.submittedBy,
      problem: idea.problem,
      solution: idea.solution,
      stakeholders: idea.stakeholders,
      targetUsers: idea.targetUsers,
      description: idea.description ?? '',
      status: 'PENDING',
    });

    await db.orm.public.RoomActivity.create({
      roomId: room.id,
      actor: idea.submittedBy,
      action: 'IDEA_SUBMITTED',
      details: `Project idea submitted: ${idea.problem}`,
    });

    return {
      id: ideaRecord.id,
      submittedBy: ideaRecord.submittedBy,
      problem: ideaRecord.problem,
      solution: ideaRecord.solution,
      stakeholders: ideaRecord.stakeholders,
      targetUsers: ideaRecord.targetUsers,
      description: ideaRecord.description,
      status: ideaRecord.status,
      createdAt: new Date(ideaRecord.createdAt).toISOString(),
    };
  }

  async voteOnIdea(code: string, ideaId: string, voterName: string) {

    const db = this.prisma.getClient();
    const room = await db.orm.public.Room.where({ code: code.toUpperCase() }).first();

    if (!room) {
      throw new NotFoundException(`Room ${code} was not found.`);
    }

    const idea = await db.orm.public.RoomIdea.where({ id: ideaId, roomId: room.id }).first();
    if (!idea) {
      throw new NotFoundException(`Idea ${ideaId} was not found in room ${code}.`);
    }

    const vote = await db.orm.public.IdeaVote.create({
      ideaId: idea.id,
      voterName: voterName,
    });

    await db.orm.public.RoomActivity.create({
      roomId: room.id,
      actor: voterName,
      action: 'IDEA_VOTED',
      details: `Member voted for idea ${idea.id}`,
    });

    return {
      id: vote.id,
      ideaId: vote.ideaId,
      voterName: vote.voterName,
      createdAt: new Date(vote.createdAt).toISOString(),
    };
  }

  async addRequirement(code: string, input: RoomRequirementInput) {
    const db = this.prisma.getClient();
    const room = await db.orm.public.Room.where({ code: code.toUpperCase() }).first();

    if (!room) {
      throw new NotFoundException(`Room ${code} was not found.`);
    }

    const requirement = await db.orm.public.Requirement.create({
      roomId: room.id,
      title: input.title,
      description: input.description,
      userStories: input.userStories,
      acceptanceCriteria: input.acceptanceCriteria,
      priority: input.priority ?? 'MEDIUM',
      type: input.type ?? 'FUNCTIONAL',
    });

    return {
      id: requirement.id,
      roomId: requirement.roomId,
      title: requirement.title,
      description: requirement.description,
      userStories: requirement.userStories,
      acceptanceCriteria: requirement.acceptanceCriteria,
      priority: requirement.priority,
      type: requirement.type,
    };
  }

  async createSprint(code: string, input: RoomSprintInput) {
    const db = this.prisma.getClient();
    const room = await db.orm.public.Room.where({ code: code.toUpperCase() }).first();

    if (!room) {
      throw new NotFoundException(`Room ${code} was not found.`);
    }

    const sprint = await db.orm.public.Sprint.create({
      roomId: room.id,
      name: input.name,
      goal: input.goal ?? '',
      status: input.status ?? 'PLANNED',
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
    });

    return {
      id: sprint.id,
      roomId: sprint.roomId,
      name: sprint.name,
      goal: sprint.goal,
      status: sprint.status,
      startDate: sprint.startDate ? new Date(sprint.startDate).toISOString() : undefined,
      endDate: sprint.endDate ? new Date(sprint.endDate).toISOString() : undefined,
    };
  }

  async createTask(code: string, input: RoomTaskInput) {
    const db = this.prisma.getClient();
    const room = await db.orm.public.Room.where({ code: code.toUpperCase() }).first();

    if (!room) {
      throw new NotFoundException(`Room ${code} was not found.`);
    }

    const task = await db.orm.public.Task.create({
      roomId: room.id,
      sprintId: input.sprintId,
      title: input.title,
      description: input.description ?? '',
      assignee: input.assignee ?? '',
      status: input.status ?? 'TODO',
      priority: input.priority ?? 'MEDIUM',
    });

    return {
      id: task.id,
      roomId: task.roomId,
      sprintId: task.sprintId,
      title: task.title,
      description: task.description,
      assignee: task.assignee,
      status: task.status,
      priority: task.priority,
    };
  }

  async submitAdvisorReview(code: string, input: RoomReviewInput) {
    const db = this.prisma.getClient();
    const room = await db.orm.public.Room.where({ code: code.toUpperCase() }).first();

    if (!room) {
      throw new NotFoundException(`Room ${code} was not found.`);
    }

    const review = await db.orm.public.AdvisorReview.create({
      roomId: room.id,
      advisorName: input.advisorName,
      advisorEmail: input.advisorEmail ?? '',
      comments: input.comments ?? '',
      suggestions: input.suggestions ?? '',
      status: input.status ?? 'PENDING',
    });

    if (review.status === 'APPROVED') {
      await db.orm.public.Room.where({ id: room.id }).update({
        status: 'APPROVED',
      });
    }

    return {
      id: review.id,
      roomId: review.roomId,
      advisorName: review.advisorName,
      advisorEmail: review.advisorEmail,
      comments: review.comments,
      suggestions: review.suggestions,
      status: review.status,
      createdAt: new Date(review.createdAt).toISOString(),
    };
  }

  async generateRoomDocumentation(code: string) {
    const db = this.prisma.getClient();
    const room = await db.orm.public.Room.where({ code: code.toUpperCase() }).first();

    if (!room) {
      throw new NotFoundException(`Room ${code} was not found.`);
    }

    const ideas = await db.orm.public.RoomIdea.where({ roomId: room.id }).all();
    const requirements = await db.orm.public.Requirement.where({ roomId: room.id }).all();
    const tasks = await db.orm.public.Task.where({ roomId: room.id }).all();

    const leadingIdea = ideas[0];
    const document = await db.orm.public.RoomDocument.create({
      roomId: room.id,
      title: `${room.title} — Project Documentation Draft`,
      content: [
        `# ${room.title}`,
        '',
        `## Project Description`,
        room.description ?? 'No description provided yet.',
        '',
        `## Problem Statement`,
        leadingIdea ? leadingIdea.problem : 'No problem statement defined yet.',
        '',
        `## Solution`,
        leadingIdea ? leadingIdea.solution : 'No solution defined yet.',
        '',
        `## Requirements`,
        requirements.length ? requirements.map((item: any) => `- ${item.title}: ${item.description}`).join('\n') : 'No requirements have been added yet.',
        '',
        `## Task Progress`,
        tasks.length ? tasks.map((task: any) => `- ${task.title}: ${task.status}`).join('\n') : 'No tasks have been added yet.',
      ].join('\n'),
    });

    return {
      id: document.id,
      roomId: document.roomId,
      title: document.title,
      content: document.content,
      generatedAt: new Date(document.generatedAt).toISOString(),
    };
  }

  async joinRoom(code: string, playerName: string): Promise<RoomRecord> {
    const db = this.prisma.getClient();
    const room = await db.orm.public.Room.where({ code: code.toUpperCase() }).first();

    if (!room) {
      throw new NotFoundException(`Room ${code} was not found.`);
    }

    const member = await db.orm.public.Player.where({ roomId: room.id }).all();

    if (member.length >= room.maxMember) {
      throw new Error('Room is full.');
    }

    const safePlayerName = this.normalizeDisplayName(playerName, 'Guest');
    const existing = (member as any[]).find((player: any) => player.name === safePlayerName);
    if (!existing) {
      await db.orm.public.Player.create({
        roomId: room.id,
        name: safePlayerName,
        isHost: false,
      });
    }

    const updatedPlayers = await db.orm.public.Player.where({ roomId: room.id }).all();
    return this.mapRoom(room, updatedPlayers);
  }


  async startRoom(code: string): Promise<RoomRecord> {
    const db = this.prisma.getClient();
    const room = await db.orm.public.Room.where({ code: code.toUpperCase() }).first();

    if (!room) {
      throw new NotFoundException(`Room ${code} was not found.`);
    }

    if (room.status === 'FINISHED') {
      throw new Error('Cannot start a finished room.');
    }

    const players = await db.orm.public.Player.where({ roomId: room.id }).all();
    if (players.length < 1) {
      throw new Error('At least one player is required to start the game.');
    }

    await db.orm.public.Room.where({ id: room.id }).update({
      status: 'IN_PROGRESS',
    });

    const updatedRoom = await db.orm.public.Room.where({ id: room.id }).first();
    return this.mapRoom(updatedRoom!, players);
  }

  



  private normalizeDisplayName(value: string | null | undefined, fallback: string): string {
    const trimmed = value?.trim() ?? '';

    if (!trimmed) {
      return fallback;
    }

    return trimmed.slice(0, 50);
  }

  private normalizeText(value: string | null | undefined, fallback: string): string {
    const trimmed = value?.trim() ?? '';
    return trimmed || fallback;
  }

  private normalizeMaxPlayers(value: number | undefined): number {
    const safeValue = typeof value === 'number' && Number.isInteger(value) ? value : 10;
    return Math.min(Math.max(safeValue, 2), 30);
  }

 
 

  private async generateUniqueRoomCode(
    db: ReturnType<PrismaService['getClient']>,
  ): Promise<string> {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    for (let attempt = 0; attempt < 20; attempt += 1) {
      let code = '';
      for (let i = 0; i < 6; i += 1) {
        code += alphabet[Math.floor(Math.random() * alphabet.length)];
      }

      const existing = await db.orm.public.Room.where({ code }).first();
      if (!existing) {
        return code;
      }
    }

    throw new Error('Unable to generate a unique room code.');
  }

  private mapRoom(room: any, players: any[]): RoomRecord {
    const mappedPlayers = players.map((player: any) => ({
      id: player.id,
      name: player.name,
      isHost: player.isHost,
      joinedAt: new Date(player.joinedAt).toISOString(),
    }));

    return {
      id: room.id,
      code: room.code,
      title: room.title ?? 'Project Room',
      description: room.description ?? undefined,
      status: room.status as RoomStatus,
      questionCount: room.questionCount ?? 0,
      currentQuestionIndex: room.currentQuestionIndex ?? 0,
      academicYear: room.academicYear ?? undefined,
      advisorName: room.advisorName ?? undefined,
      advisorEmail: room.advisorEmail ?? undefined,
      createdAt: new Date(room.createdAt).toISOString(),
      updatedAt: new Date(room.updatedAt).toISOString(),
      members: mappedPlayers,
    };
  }

}

