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
    const questions = await db.orm.public.Question.all();

    if (!questions.length) {
      throw new Error('No questions available for this game.');
    }

    const selectedQuestions = questions.slice(0, room.questionCount || questions.length);

    await db.orm.public.GameQuestion.where({ roomId: room.id }).deleteAll();

    for (const [index, question] of selectedQuestions.entries()) {
      await db.orm.public.GameQuestion.create({
        roomId: room.id,
        questionId: question.id,
        questionOrder: index + 1,
      });
    }

    const currentQuestion = selectedQuestions[0];

    await db.orm.public.Room.where({ id: room.id }).update({
      status: 'IN_PROGRESS',
      currentQuestionIndex: 0,
    });

    return {
      roomCode: room.code,
      status: 'IN_PROGRESS',
      players: players.map((player) => ({
        id: player.id,
        name: player.name,
        isHost: player.isHost,
      })),
      currentQuestion: currentQuestion
        ? {
            id: currentQuestion.id,
            text: currentQuestion.text,
            category: currentQuestion.category,
            order: 1,
          }
        : null,
      questionCount: selectedQuestions.length,
      currentQuestionIndex: 0,
      votes: [],
    };
  }
}
