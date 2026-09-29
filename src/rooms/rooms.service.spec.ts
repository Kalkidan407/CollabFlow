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
      title: 'Project Room',
      description: 'Collaboration workspace for project planning and execution.',
      status: 'WAITING',
      maxPlayers: 10,
      timeLimit: 30,
      timeLimitUnit: 'SECONDS',
      questionCount: 2,
      currentQuestionIndex: 0,
      academicYear: '2026/27',
      advisorName: 'Advisor',
      advisorEmail: 'advisor@university.edu',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const rooms: any[] = [roomState];
    const players: any[] = [{ id: 'player-1', roomId: 'room-1', name: 'Host', isHost: true, joinedAt: new Date() }];
    const ideas: any[] = [];
    const requirements: any[] = [];
    const tasks: any[] = [];
    const docs: any[] = [];
    const activities: any[] = [];

    const fakeDb = {
      orm: {
        public: {
          Room: {
            create: async (data: any) => {
              const code = data.code ?? 'AB12CD';
              const created = {
                id: `room-${rooms.length + 1}`,
                ...roomState,
                ...data,
                code,
                createdAt: new Date(),
                updatedAt: new Date(),
              };
              rooms.push(created);
              Object.assign(roomState, created);
              return created;
            },
            where: (criteria: any) => ({
              first: async () => {
                if (!criteria) {
                  const latest = rooms.at(-1);
                  return latest ? { ...latest } : null;
                }

                const entries = rooms.filter((entry) => {
                  if (criteria.code && entry.code !== criteria.code) return false;
                  if (criteria.id && entry.id !== criteria.id) return false;
                  return true;
                });
                return entries.length ? { ...entries[0] } : null;
              },
              update: async (data: any) => {
                const current = rooms.find((entry) => entry.id === roomState.id) ?? roomState;
                Object.assign(current, data, { updatedAt: new Date() });
                Object.assign(roomState, current);
                return { ...current };
              },
            }),
          },
          Player: {
            create: async (data: any) => {
              const existing = players.find(
                (player) => player.roomId === data.roomId && player.name === data.name,
              );
              if (existing) {
                return existing;
              }

              const created = { id: `player-${Math.random().toString(16).slice(2)}`, joinedAt: new Date(), ...data };
              players.push(created);
              return created;
            },
            where: (criteria: any) => ({
              all: async () => players.filter((player) => (!criteria || !criteria.roomId ? true : player.roomId === criteria.roomId)),
            }),
          },
          Question: {
            create: async (data: any) => ({ id: `q-${Math.random().toString(16).slice(2)}`, ...data, createdAt: new Date() }),
          },
          RoomIdea: {
            create: async (data: any) => {
              const created = { id: `idea-${Math.random().toString(16).slice(2)}`, createdAt: new Date(), ...data };
              ideas.push(created);
              return created;
            },
            where: (criteria: any) => ({
              all: async () => ideas.filter((entry) => (!criteria || !criteria.roomId ? true : entry.roomId === criteria.roomId)),
              first: async () => {
                if (!criteria) return ideas[0] ?? null;
                const match = ideas.find((entry) => {
                  if (criteria.id && entry.id !== criteria.id) return false;
                  if (criteria.roomId && entry.roomId !== criteria.roomId) return false;
                  return true;
                });
                return match ?? null;
              },
            }),
          },
          IdeaVote: {
            create: async (data: any) => ({ id: `vote-${Math.random().toString(16).slice(2)}`, createdAt: new Date(), ...data }),
          },
          Requirement: {
            create: async (data: any) => {
              const created = { id: `req-${Math.random().toString(16).slice(2)}`, ...data };
              requirements.push(created);
              return created;
            },
            where: (criteria: any) => ({ all: async () => requirements.filter((entry) => (!criteria || !criteria.roomId ? true : entry.roomId === criteria.roomId)) }),
          },
          Sprint: {
            create: async (data: any) => ({ id: `sprint-${Math.random().toString(16).slice(2)}`, ...data }),
          },
          Task: {
            create: async (data: any) => {
              const created = { id: `task-${Math.random().toString(16).slice(2)}`, ...data };
              tasks.push(created);
              return created;
            },
            where: (criteria: any) => ({ all: async () => tasks.filter((entry) => (!criteria || !criteria.roomId ? true : entry.roomId === criteria.roomId)) }),
          },
          AdvisorReview: {
            create: async (data: any) => ({ id: `review-${Math.random().toString(16).slice(2)}`, createdAt: new Date(), ...data }),
          },
          RoomDocument: {
            create: async (data: any) => {
              const created = { id: `doc-${Math.random().toString(16).slice(2)}`, generatedAt: new Date(), ...data };
              docs.push(created);
              return created;
            },
          },
          RoomActivity: {
            create: async (data: any) => ({ id: `activity-${Math.random().toString(16).slice(2)}`, createdAt: new Date(), ...data }),
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
      members: [{ name: 'Host' }],
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

    await expect(service.extendTime(created.code, 30, 'SECONDS')).resolves.toMatchObject({
      timeLimit: 150,
      timeLimitUnit: 'SECONDS',
    });
  });

  it('should support the project collaboration workflow inside a room', async () => {
    const room = await service.createProjectRoom({
      title: 'Smart Campus Transportation System',
      description: 'A route-planning platform for student mobility',
      teamSize: 5,
      academicYear: '2026/27',
      advisorName: 'Dr. Abebe',
      advisorEmail: 'abebe@university.edu',
      hostName: 'Alem',
    });

    await service.inviteMember(room.code, { name: 'Biruk', email: 'biruk@uni.edu', role: 'Backend Developer' });
    const idea = await service.submitIdea(room.code, {
      submittedBy: 'Alem',
      problem: 'Students cannot find reliable transport routes on campus.',
      solution: 'A real-time commuter route planner for students and drivers.',
      stakeholders: ['Students', 'Drivers', 'Campus office'],
      targetUsers: ['Undergraduate students'],
      description: 'Project idea draft',
    });

    await service.voteOnIdea(room.code, idea.id, 'Biruk');

    const requirements = await service.addRequirement(room.code, {
      title: 'Real-time route tracking',
      description: 'The system should show live route availability.',
      userStories: ['As a student, I want live route updates so I can travel confidently.'],
      acceptanceCriteria: ['The route should update in real time.'],
      priority: 'HIGH',
      type: 'FUNCTIONAL',
    });

    const sprint = await service.createSprint(room.code, {
      name: 'Sprint 1',
      goal: 'Define architecture and core routes',
      status: 'PLANNED',
    });

    const task = await service.createTask(room.code, {
      sprintId: sprint.id,
      title: 'Set up route API',
      description: 'Create backend endpoints for route retrieval',
      assignee: 'Biruk',
      status: 'TODO',
      priority: 'HIGH',
    });

    const review = await service.submitAdvisorReview(room.code, {
      advisorName: 'Dr. Abebe',
      advisorEmail: 'abebe@university.edu',
      comments: 'This is a strong project idea with good real-world impact.',
      suggestions: 'Focus on route management and user flow.',
      status: 'APPROVED',
    });

    const doc = await service.generateRoomDocumentation(room.code);

    expect(room.title).toBe('Smart Campus Transportation System');
    expect(room.status).toBe('IDEATION');
    expect(idea.problem).toContain('reliable transport');
    expect(requirements.title).toBe('Real-time route tracking');
    expect(task.title).toBe('Set up route API');
    expect(review.status).toBe('APPROVED');
    expect(doc.title).toContain('Smart Campus Transportation System');
  });
});
