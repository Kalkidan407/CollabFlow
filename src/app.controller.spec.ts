import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return the app status message', () => {
      expect(appController.getHello()).toBe('CollabFlow platform is running');
    });

    it('should return the health payload', () => {
      expect(appController.getHealth()).toEqual({
        status: 'ok',
        service: 'collabflow-api',
      });
    });
  });
});
