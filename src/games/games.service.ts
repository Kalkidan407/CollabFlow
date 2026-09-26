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
    const gameQuestions = await db.orm.public.GameQuestion.where({ roomId: room.id }).all();

    if (!gameQuestions.length) {
      throw new Error('No questions available for this game. Add questions to this room before starting.');
    }

    const selectedQuestions = (
      await Promise.all(
        gameQuestions
          .sort((a, b) => a.questionOrder - b.questionOrder)
          .slice(0, room.questionCount || gameQuestions.length)
          .map(async (gameQuestion) => {
            const question = await db.orm.public.Question.where({ id: gameQuestion.questionId }).first();
            if (!question) {
              return null;
            }

            return {
              id: question.id,
              text: question.text,
              category: question.category,
              order: gameQuestion.questionOrder,
            };
          }),
      )
    ).filter((question): question is NonNullable<typeof question> => Boolean(question));

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
            order: currentQuestion.order,
          }
        : null,
      questionCount: selectedQuestions.length,
      currentQuestionIndex: 0,
      votes: [],
    };
  }
}
