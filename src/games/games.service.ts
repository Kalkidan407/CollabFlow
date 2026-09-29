import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export type GameStatus = 'WAITING' | 'IN_PROGRESS' | 'FINISHED';

export interface GameQuestionState {
  id: string;
  text: string;
  category: string;
  order: number;
}

export interface GameState {
  roomCode: string;
  status: GameStatus;
  players: Array<{ id: string; name: string; isHost: boolean }>;
  currentQuestion: GameQuestionState | null;
  questionCount: number;
  currentQuestionIndex: number;
  votes: Array<{ voterId: string; votedForId: string }>;
}

@Injectable()
export class GamesService {
  constructor(private readonly prisma: PrismaService) {}

  async startGame(roomCode: string): Promise<GameState> {
    const db = this.prisma.getClient();
    const room = await db.orm.public.Room.where({ code: roomCode.toUpperCase() }).first();

    if (!room) {
      throw new NotFoundException(`Room ${roomCode} was not found.`);
    }

    const players = await db.orm.public.Player.where({ roomId: room.id }).all();
    const allQuestions = await db.orm.public.Question.where({}).all();

    if (!allQuestions.length) {
      throw new Error('No questions available for this game. Add questions before starting.');
    }

    const selectedQuestions = (allQuestions as any[])
      .slice(0, room.questionCount || allQuestions.length)
      .map((question: any, index: number) => ({
        id: question.id,
        text: question.text,
        category: question.category,
        order: index + 1,
      }));

    if (!selectedQuestions.length) {
      throw new Error('No questions available for this game.');
    }

    const currentQuestion = selectedQuestions[0];

    await db.orm.public.Room.where({ id: room.id }).update({
      status: 'IN_PROGRESS',
      currentQuestionIndex: 0,
    });

    return {
      roomCode: room.code,
      status: 'IN_PROGRESS',
      players: (players as any[]).map((player: any) => ({
        id: player.id,
        name: player.name,
        isHost: player.isHost,
      })),
      currentQuestion: currentQuestion
        ? {
            id: currentQuestion.id,
            text: currentQuestion.text,
            category: currentQuestion.category,
            order: currentQuestion.order,
          }
        : null,
      questionCount: selectedQuestions.length,
      currentQuestionIndex: 0,
      votes: [],
    };
  }
}
