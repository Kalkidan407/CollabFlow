import { Test, TestingModule } from '@nestjs/testing';
import { WorkspacesController } from './workspaces.controller.js';
import { WorkspacesService } from './workspaces.service.js';

describe('WorkspacesController', () => {
  let controller: WorkspacesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkspacesController],
      providers: [
        {
          provide: WorkspacesService,
          useValue: {
            listWorkspaces: () => [],
            createProjectWorkspace: () => ({ id: 'workspace-1', title: 'SpecFlow', status: 'DRAFT', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }),
            importSpecification: () => ({ id: 'workspace-1', title: 'SpecFlow', status: 'READY_FOR_REVIEW', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }),
          },
        },
      ],
    }).compile();

    controller = module.get<WorkspacesController>(WorkspacesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
