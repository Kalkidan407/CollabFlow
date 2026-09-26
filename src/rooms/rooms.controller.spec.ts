import { Test, TestingModule } from '@nestjs/testing';
import { RoomsController } from './rooms.controller.js';
import { RoomsService } from './rooms.service.js';

describe('RoomsController', () => {
  let controller: RoomsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoomsController],
      providers: [
        {
          provide: RoomsService,
          useValue: {
            listRooms: () => [],
            createRoom: () => ({ id: '1', code: 'ABC123', status: 'WAITING', maxPlayers: 10, players: ['Alice'] }),
            joinRoom: () => ({ id: '1', code: 'ABC123', status: 'WAITING', maxPlayers: 10, players: ['Alice', 'Bob'] }),
          },
        },
      ],
    }).compile();

    controller = module.get<RoomsController>(RoomsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
