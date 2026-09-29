import { GamesService } from './games.service.js';

describe('GamesService', () => {
  it('should start a game from the room question list', async () => {
    const fakeQuestionLookup = new Map([
      ['q1', { id: 'q1', text: 'Who would most likely win a karaoke battle?', category: 'fun' }],
      ['q2', { id: 'q2', text: 'Who is most likely to forget their keys?', category: 'fun' }],
    ]);

    const fakeDb = {
      orm: {
        public: {
          Room: {
            where: () => ({
              first: async () => ({
                id: 'room-1',
                code: 'ABCD12',
                status: 'WAITING',
                maxPlayers: 10,
                questionCount: 2,
                currentQuestionIndex: 0,
              }),
              update: async (data: any) => ({
                id: 'room-1',
                ...data,
              }),
            }),
          },
          Player: {
            where: () => ({
              all: async () => [
                { id: 'p1', name: 'Alice', roomId: 'room-1', isHost: true, joinedAt: new Date() },
                { id: 'p2', name: 'Bob', roomId: 'room-1', isHost: false, joinedAt: new Date() },
              ],
            }),
          },
          Question: {
            where: () => ({
              all: async () => [
                { id: 'q1', text: 'Who would most likely win a karaoke battle?', category: 'fun' },
                { id: 'q2', text: 'Who is most likely to forget their keys?', category: 'fun' },
              ],
              first: async () => fakeQuestionLookup.get('q1') ?? null,
            }),
          },
          Vote: {
            where: () => ({
              all: async () => [],
              first: async () => null,
            }),
            create: async (data: any) => ({ id: 'vote-1', ...data }),
          },
        },
      },
    };

    const service = new GamesService({ getClient: () => fakeDb } as any);
    const state = await service.startGame('ABCD12');

    expect(state.roomCode).toBe('ABCD12');
    expect(state.players).toHaveLength(2);
    expect(state.currentQuestion).toMatchObject({ id: 'q1', order: 1 });
    expect(state.questionCount).toBe(2);
    expect(state.status).toBe('IN_PROGRESS');
  });
});
