import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { RoomsService } from './rooms.service.js';

describe('RoomsService', () => {
  let service: RoomsService;
  let roomState: any;

  beforeEach(() => {
    roomState = {
      id: 'room-1',
      code: 'AB12CD',
      status: 'WAITING',
      maxPlayers: 10,
      timeLimit: 30,
      questionCount: 2,
      currentQuestionIndex: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const fakeDb = {
      orm: {
        public: {
          Room: {
            create: async (data: any) => {
              const created = { id: 'room-1', code: 'AB12CD', ...data };
              Object.assign(roomState, created);
              return created;
            },
            where: (criteria: any) => ({
              first: async () => {
                if (criteria && (criteria.code === 'AB12CD' || criteria.id === 'room-1')) {
                  return { ...roomState };
                }
                return null;
              },
              update: async (data: any) => {
                if (typeof data.questionCount === 'number') {
                  roomState.questionCount = data.questionCount;
                }
                if (typeof data.status === 'string') {
                  roomState.status = data.status;
                }
                if (typeof data.timeLimit === 'number') {
                  roomState.timeLimit = data.timeLimit;
                }
                if (typeof data.timeLimitUnit === 'string') {
                  roomState.timeLimitUnit = data.timeLimitUnit;
                }
                if (data.updatedAt instanceof Date || typeof data.updatedAt === 'string') {
                  roomState.updatedAt = new Date(data.updatedAt);
                }
                roomState.updatedAt = new Date();
                return { ...roomState, ...data };
              },
            }),
          },
          Player: {
            create: async (data: any) => ({ id: 'player-1', ...data, joinedAt: new Date() }),
            where: () => ({
              all: async () => [{ id: 'player-1', name: 'Host', roomId: 'room-1', isHost: true, joinedAt: new Date() }],
            }),
          },
          Question: {
            create: async (data: any) => ({ id: `q-${Math.random().toString(16).slice(2)}`, ...data, createdAt: new Date() }),
          },
          GameQuestion: {
            where: () => ({
              all: async () => [],
            }),
            create: async (data: any) => ({ id: `gq-${Math.random().toString(16).slice(2)}`, ...data }),
          },
        },
      },
    };

    service = new RoomsService({ getClient: () => fakeDb } as unknown as PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a room without questions', async () => {
    const room = await service.createRoom('Host');

    expect(room).toMatchObject({
      timeLimit: 30,
      players: [{ name: 'Host' }],
    });
    expect(room.code).toMatch(/^[A-Z0-9]{6}$/);
  });

  it('should preserve a custom time limit in seconds', async () => {
    const room = await service.createRoom('Host', { timeLimit: 45 });

    expect(room).toMatchObject({
      timeLimit: 45,
    });
    expect(room.code).toMatch(/^[A-Z0-9]{6}$/);
  });

  it('should add host-provided questions to an existing room', async () => {
    await expect(
      service.addQuestionsToRoom('AB12CD', ['Who would win?', 'Who is most likely to be late?']),
    ).resolves.toMatchObject({
      code: 'AB12CD',
      questionCount: 2,
    });
  });

  it('should allow a host to choose a custom question count above 10', async () => {
    await expect(
      service.addQuestionsToRoom('AB12CD', Array.from({ length: 12 }, (_, index) => `Question ${index + 1}`), {
        questionCount: 12,
      }),
    ).resolves.toMatchObject({
      code: 'AB12CD',
      questionCount: 12,
    });
  });

  it('should create a reusable question with a supported category', async () => {
    await expect(service.createQuestion('Who would win?', 'FUN')).resolves.toMatchObject({
      text: 'Who would win?',
      category: 'FUN',
    });
  });

  it('should allow the host to start the room even before the room is full', async () => {
    await expect(service.startRoom('AB12CD')).resolves.toMatchObject({
      code: 'AB12CD',
      status: 'IN_PROGRESS',
    });
  });

  it('should remind the host once the room passes half of the time limit', async () => {
    roomState.status = 'IN_PROGRESS';
    roomState.updatedAt = new Date(Date.now() - 16_000);
    roomState.timeLimit = 30;

    await expect(service.checkRoomStatus('AB12CD')).resolves.toMatchObject({
      code: 'AB12CD',
      status: 'IN_PROGRESS',
      reminder: expect.stringContaining('add more time'),
    });
  });

  it('should finish the room automatically when the time limit is reached', async () => {
    roomState.status = 'IN_PROGRESS';
    roomState.updatedAt = new Date(Date.now() - 31_000);
    roomState.timeLimit = 30;

    await expect(service.checkRoomStatus('AB12CD')).resolves.toMatchObject({
      code: 'AB12CD',
      status: 'FINISHED',
    });
  });

  it('should allow the host to add more time to an in-progress room', async () => {
    roomState.status = 'IN_PROGRESS';
    roomState.updatedAt = new Date(Date.now() - 15_000);
    roomState.timeLimit = 30;

    await expect(service.extendTime('AB12CD', 20)).resolves.toMatchObject({
      code: 'AB12CD',
      status: 'IN_PROGRESS',
      timeLimit: 50,
    });
  });

  it('should convert room creation and extension values using the selected time unit', async () => {
    const created = await service.createRoom('Host', { timeLimit: 2, timeUnit: 'MINUTES' });
    expect(created).toMatchObject({
      timeLimit: 120,
      timeLimitUnit: 'MINUTES',
    });

    await expect(service.extendTime('AB12CD', 30, 'SECONDS')).resolves.toMatchObject({
      timeLimit: 150,
      timeLimitUnit: 'SECONDS',
    });
  });
});
