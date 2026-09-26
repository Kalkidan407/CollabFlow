import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export type RoomStatus = 'WAITING' | 'IN_PROGRESS' | 'FINISHED';

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

  async createRoom(hostName: string): Promise<RoomRecord> {
    const db = this.prisma.getClient();
    const code = await this.generateUniqueRoomCode(db);

    const room = await db.orm.public.Room.create({
      code,
      status: 'WAITING',
      maxPlayers: 10,
      questionCount: 10,
      currentQuestionIndex: 0,
    });

    const host = await db.orm.public.Player.create({
      roomId: room.id,
      name: hostName,
      isHost: true,
    });

    return this.mapRoom(room, [host]);
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

    const existing = players.find((player) => player.name === playerName);
    if (!existing) {
      await db.orm.public.Player.create({
        roomId: room.id,
        name: playerName,
        isHost: false,
      });
    }

    const updatedPlayers = await db.orm.public.Player.where({ roomId: room.id }).all();
    return this.mapRoom(room, updatedPlayers);
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

