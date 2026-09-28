import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export type RoomStatus = 'WAITING' | 'IN_PROGRESS' | 'FINISHED';
export type QuestionCategory = 'CUSTOM' | 'FUN' | 'SERIOUS' | 'ICEBREAKER';

export interface RoomPlayer {
  id: string;
  name: string;
  isHost: boolean;
  joinedAt: string;
}

export interface RoomRecord {
  id: string;
  code: string;
  status: RoomStatus;
  maxPlayers: number;
  timeLimit: number;
  questionCount: number;
  currentQuestionIndex: number;
  createdAt: string;
  updatedAt: string;
  players: RoomPlayer[];
}

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  getMessage() {
    return 'Rooms service is working!';
  }

  async listRooms(): Promise<RoomRecord[]> {
    const db = this.prisma.getClient();
    const rooms = await db.orm.public.Room.all();

    return Promise.all(
      rooms.map(async (room) => {
        const players = await db.orm.public.Player.where({ roomId: room.id }).all();
        return this.mapRoom(room, players);
      }),
    );
  }

  async createRoom(hostName: string, options?: { maxPlayers?: number; timeLimit?: number }): Promise<RoomRecord> {
    const db = this.prisma.getClient();
    const code = await this.generateUniqueRoomCode(db);
    const safeHostName = this.normalizeDisplayName(hostName, 'Host');
    const maxPlayers = this.normalizeMaxPlayers(options?.maxPlayers ?? 10);
    const timeLimit = this.normalizeTimeLimit(options?.timeLimit ?? 30);

    const room = await db.orm.public.Room.create({
      code,
      status: 'WAITING',
      maxPlayers,
      timeLimit,
      questionCount: 0,
      currentQuestionIndex: 0,
    });

    const host = await db.orm.public.Player.create({
      roomId: room.id,
      name: safeHostName,
      isHost: true,
    });

    const roomWithPlayers = await db.orm.public.Room.where({ id: room.id }).first();
    const players = await db.orm.public.Player.where({ roomId: room.id }).all();
    return this.mapRoom(roomWithPlayers!, players);
  }

  async addQuestionsToRoom(
    code: string,
    questions: string[],
    options?: { questionCount?: number },
  ): Promise<RoomRecord> {
    const db = this.prisma.getClient();
    const room = await db.orm.public.Room.where({ code: code.toUpperCase() }).first();

    if (!room) {
      throw new NotFoundException(`Room ${code} was not found.`);
    }

    const normalizedQuestions = this.normalizeQuestions(questions);
    if (!normalizedQuestions.length) {
      throw new Error('At least one question is required.');
    }

    const existingQuestions = await db.orm.public.GameQuestion.where({ roomId: room.id }).all();
    const nextOrder = existingQuestions.length + 1;

    for (const [index, questionText] of normalizedQuestions.entries()) {
      const question = await db.orm.public.Question.create({
        text: questionText,
        category: 'custom',
      });

      await db.orm.public.GameQuestion.create({
        roomId: room.id,
        questionId: question.id,
        questionOrder: nextOrder + index,
      });
    }

    const totalQuestions = existingQuestions.length + normalizedQuestions.length;
    const preferredQuestionCount = options?.questionCount ?? totalQuestions;
    const safeQuestionCount = this.normalizeQuestionCount(preferredQuestionCount, totalQuestions);

    await db.orm.public.Room.where({ id: room.id }).update({
      questionCount: safeQuestionCount,
    });

    const updatedRoom = await db.orm.public.Room.where({ id: room.id }).first();
    const players = await db.orm.public.Player.where({ roomId: room.id }).all();
    return this.mapRoom(updatedRoom!, players);
  }

  async joinRoom(code: string, playerName: string): Promise<RoomRecord> {
    const db = this.prisma.getClient();
    const room = await db.orm.public.Room.where({ code: code.toUpperCase() }).first();

    if (!room) {
      throw new NotFoundException(`Room ${code} was not found.`);
    }

    const players = await db.orm.public.Player.where({ roomId: room.id }).all();

    if (players.length >= room.maxPlayers) {
      throw new Error('Room is full.');
    }

    const safePlayerName = this.normalizeDisplayName(playerName, 'Guest');
    const existing = players.find((player) => player.name === safePlayerName);
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

  async createQuestion(text: string, category: QuestionCategory = 'CUSTOM'): Promise<{ id: string; text: string; category: QuestionCategory }> {
    const normalizedText = this.normalizeQuestions([text])[0];
    if (!normalizedText) {
      throw new Error('Question text is required.');
    }

    const safeCategory = this.normalizeQuestionCategory(category);
    const db = this.prisma.getClient();
    const question = await db.orm.public.Question.create({
      text: normalizedText,
      category: safeCategory,
    });

    return {
      id: question.id,
      text: question.text,
      category: question.category as QuestionCategory,
    };
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

  private normalizeMaxPlayers(value: number | undefined): number {
    const safeValue = typeof value === 'number' && Number.isInteger(value) ? value : 10;
    return Math.min(Math.max(safeValue, 2), 30);
  }

  private normalizeTimeLimit(value: number | undefined): number {
    const safeValue = typeof value === 'number' && Number.isInteger(value) ? value : 30;
    return Math.min(Math.max(safeValue, 15), 180);
  }

  private normalizeQuestionCount(value: number | undefined, maxAllowed: number): number {
    const safeValue = typeof value === 'number' && Number.isInteger(value) ? value : maxAllowed;
    return Math.max(1, Math.min(safeValue, maxAllowed));
  }

  private normalizeQuestionCategory(value: string | undefined): QuestionCategory {
    const validCategories: QuestionCategory[] = ['CUSTOM', 'FUN', 'SERIOUS', 'ICEBREAKER'];
    const safeValue = typeof value === 'string' ? value.trim().toUpperCase() : 'CUSTOM';
    return validCategories.includes(safeValue as QuestionCategory) ? (safeValue as QuestionCategory) : 'CUSTOM';
  }

  private normalizeQuestions(questions: string[] | null | undefined): string[] {
    const normalized = (questions ?? [])
      .filter((question): question is string => typeof question === 'string')
      .map((question) => question.trim())
      .filter((question) => question.length > 0)
      .map((question) => question.slice(0, 500));

    return Array.from(new Set(normalized));
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

  private mapRoom(
    room: {
      id: string;
      code: string;
      status: string;
      maxPlayers: number;
      timeLimit: number;
      questionCount: number;
      currentQuestionIndex: number;
      createdAt: string | Date;
      updatedAt: string | Date;
    },
    players: Array<{
      id: string;
      name: string;
      isHost: boolean;
      joinedAt: string | Date;
    }>,
  ): RoomRecord {
    return {
      id: room.id,
      code: room.code,
      status: room.status as RoomStatus,
      maxPlayers: room.maxPlayers,
      timeLimit: Number(room.timeLimit ?? 30),
      questionCount: room.questionCount,
      currentQuestionIndex: room.currentQuestionIndex,
      createdAt: new Date(room.createdAt).toISOString(),
      updatedAt: new Date(room.updatedAt).toISOString(),
      players: players.map((player) => ({
        id: player.id,
        name: player.name,
        isHost: player.isHost,
        joinedAt: new Date(player.joinedAt).toISOString(),
      })),
    };
  }

}

