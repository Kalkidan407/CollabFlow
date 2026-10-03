import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service.js';
import { RoomsService } from './rooms.service.js';
import { member } from '@prisma/orm-postgres/contract-builder';

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
      maxMember: 10,
      questionCount: 2,
      currentQuestionIndex: 0,
      academicYear: '2026/27',
      advisorName: 'Advisor',
      advisorEmail: 'advisor@university.edu',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const rooms: any[] = [roomState];
    const members: any[] = [{ id: 'member-1', roomId: 'room-1', name: 'Host', isHost: true, joinedAt: new Date() }];
    const ideas: any[] = [];
    const requirements: any[] = [];
    const tasks: any[] = [];
    const docs: any[] = [];
    

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
          Member: {
            create: async (data: any) => {
              const existing = members.find(
                (member) => member.roomId === data.roomId && member.name === data.name,
              );
              if (existing) {
                return existing;
              }

              const created = { id: `member-${Math.random().toString(16).slice(2)}`, joinedAt: new Date(), ...data };
              members.push(created);
              return created;
            },
            where: (criteria: any) => ({
              all: async () => members.filter((member) => (!criteria || !criteria.roomId ? true : member.roomId === criteria.roomId)),
            }),
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




  it('should allow the host to start the room even before the room is full', async () => {
    await expect(service.startRoom('AB12CD')).resolves.toMatchObject({
      code: 'AB12CD',
      status: 'IN_PROGRESS',
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
