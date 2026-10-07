import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

export type WorkspaceStatus = 'DRAFT' | 'APPROVED' | 'MISMATCH_FOUND';

export interface SpecificationDraft {
  overview: string;
  goals: string[];
  nonGoals?: string[];
  requirements: string[];
  architecture?: string;
  acceptanceCriteria: string[];
}

export interface RepositorySyncInfo {
  provider: 'github' | 'gitlab' | 'azure-devops';
  url: string;
  defaultBranch?: string;
  files?: string[];
  lastSyncedAt?: string;
}

export interface ProjectWorkspaceRecord {
  id: string;
  title: string;
  description?: string;
  status: WorkspaceStatus;
  source?: 'draft' | 'imported';
  repository?: RepositorySyncInfo | null;
  specification?: (SpecificationDraft & { importedFrom?: string }) | null;
  reviewStatus?: 'READY_FOR_REVIEW' | 'IN_REVIEW' | 'APPROVED';
  shareUrl?: string;
  projects: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectWorkspaceInput {
  title: string;
  description?: string;
  repositoryUrl?: string;
  defaultBranch?: string;
  overview?: string;
  goals?: string[];
  requirements?: string[];
  architecture?: string;
  acceptanceCriteria?: string[];
  source?: 'draft' | 'imported';
}

@Injectable()
export class WorkspacesService {
  private readonly workspaces = new Map<string, ProjectWorkspaceRecord>();

  constructor(private readonly prisma: PrismaService) {}

  async listWorkspaces(): Promise<ProjectWorkspaceRecord[]> {
    return Array.from(this.workspaces.values());
  }

  async createProjectWorkspace(data: CreateProjectWorkspaceInput): Promise<ProjectWorkspaceRecord> {
    const id = `workspace-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const now = new Date().toISOString();

    const specification: SpecificationDraft & { importedFrom?: string } = {
      overview: data.overview ?? 'Define the product intent, architecture decisions, and validation criteria.',
      goals: data.goals ?? ['Document the product purpose', 'Align implementation with the written specification'],
      nonGoals: ['Track sprint tasks manually', 'Replace the Git repository as source of truth'],
      requirements: data.requirements ?? ['Write the specification', 'Connect the repo', 'Check implementation against the spec'],
      architecture: data.architecture ?? 'Document the main modules, integrations, and review process.',
      acceptanceCriteria: data.acceptanceCriteria ?? ['The spec is clear', 'The implementation can be checked against it'],
      importedFrom: data.source === 'imported' ? 'uploaded-srs-document' : undefined,
    };

    const workspace: ProjectWorkspaceRecord = {
      id,
      title: data.title,
      description: data.description ?? 'Specification-first workspace for architecture and implementation review.',
      status: 'DRAFT',
      source: data.source ?? 'draft',
      repository: data.repositoryUrl
        ? {
            provider: 'github',
            url: data.repositoryUrl,
            defaultBranch: data.defaultBranch ?? 'main',
            files: [],
            lastSyncedAt: now,
          }
        : null,
      specification,
      reviewStatus: 'READY_FOR_REVIEW',
      shareUrl: `https://specflow.example/reviews/${id}`,
      projects: [],
      createdAt: now,
      updatedAt: now,
    };

    this.workspaces.set(id, workspace);
    return workspace;
  }

  async createProjectInWorkspace(workspaceId: string, input: Partial<CreateProjectWorkspaceInput> & { title: string }) {
    const workspace = await this.getWorkspace(workspaceId);

    const project = {
      id: `project-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      workspaceId,
      title: input.title,
      description: input.description ?? 'Project created inside the workspace.',
      status: 'DRAFT' as WorkspaceStatus,
      source: input.source ?? 'draft',
      repository: input.repositoryUrl
        ? {
            provider: 'github',
            url: input.repositoryUrl,
            defaultBranch: input.defaultBranch ?? 'main',
            files: [],
            lastSyncedAt: new Date().toISOString(),
          }
        : null,
      specification: {
        overview: input.overview ?? 'Project created to track the implementation within this workspace.',
        goals: input.goals ?? ['Document the product intent', 'Align implementation with the written spec'],
        nonGoals: ['Track sprint tasks manually'],
        requirements: input.requirements ?? ['Define the behavior', 'Validate implementation against the workspace spec'],
        architecture: input.architecture ?? 'Document the core modules, service boundaries, and validation process.',
        acceptanceCriteria: input.acceptanceCriteria ?? ['The project is connected to the workspace spec', 'The implementation can be reviewed'],
        importedFrom: input.source === 'imported' ? 'uploaded-srs-document' : undefined,
      },
      reviewStatus: 'READY_FOR_REVIEW',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as const;

    if (!workspace.projects.includes(project.id)) {
      workspace.projects.push(project.id);
    }

    workspace.updatedAt = new Date().toISOString();
    return { workspaceId, project };
  }

  async importSpecification(workspaceId: string, specification: Partial<SpecificationDraft>) {
    const workspace = await this.getWorkspace(workspaceId);
    workspace.specification = {
      overview: specification.overview ?? workspace.specification?.overview ?? 'Imported specification',
      goals: specification.goals ?? workspace.specification?.goals ?? ['Define product intent'],
      nonGoals: specification.nonGoals ?? workspace.specification?.nonGoals ?? [],
      requirements: specification.requirements ?? workspace.specification?.requirements ?? ['Document the required behavior'],
      architecture: specification.architecture ?? workspace.specification?.architecture ?? 'Architecture to be defined',
      acceptanceCriteria: specification.acceptanceCriteria ?? workspace.specification?.acceptanceCriteria ?? ['The implementation matches the spec'],
      importedFrom: specification.importedFrom ?? workspace.specification?.importedFrom ?? 'uploaded-srs-document',
    };

    workspace.source = 'imported';
    workspace.status = 'READY_FOR_REVIEW';
    return workspace;
  }

  async connectRepository(workspaceId: string, repo: RepositorySyncInfo) {
    const workspace = await this.getWorkspace(workspaceId);
    workspace.repository = {
      provider: repo.provider ?? 'github',
      url: repo.url,
      defaultBranch: repo.defaultBranch ?? 'main',
      files: repo.files ?? [],
      lastSyncedAt: new Date().toISOString(),
    };
    return workspace.repository;
  }

  async checkImplementationAgainstSpec(workspaceId: string, files: string[] = [], context?: string) {
    const workspace = await this.getWorkspace(workspaceId);
    const fileList = files ?? [];
    const requirementText = [
      ...(workspace.specification?.requirements ?? []),
      workspace.specification?.architecture ?? '',
      context ?? '',
    ].join(' ').toLowerCase();

    const mismatches = [] as Array<{ message: string; severity: 'warning' | 'critical'; filePath?: string }>;

    if (requirementText.includes('sync') && !fileList.some((file) => /sync|repo|integration/i.test(file))) {
      mismatches.push({
        message: 'The specification references repository syncing or integration work, but no matching implementation file was detected.',
        severity: 'warning',
        filePath: 'repository',
      });
    }

    if (fileList.length === 0) {
      mismatches.push({
        message: 'No implementation files were connected for validation.',
        severity: 'critical',
        filePath: 'repository',
      });
    }

    workspace.status = mismatches.length > 0 ? 'MISMATCH_FOUND' : 'READY_FOR_REVIEW';

    return {
      workspaceId,
      summary: `Specification review completed for ${workspace.title}. ${mismatches.length} mismatch(es) identified.`,
      mismatches,
      checkedAt: new Date().toISOString(),
    };
  }

  async shareProjectForReview(workspaceId: string, reviewer: string) {
    const workspace = await this.getWorkspace(workspaceId);
    const shareUrl = `https://specflow.example/reviews/${workspace.id}`;

    workspace.reviewStatus = 'READY_FOR_REVIEW';
    workspace.shareUrl = shareUrl;
    workspace.status = 'READY_FOR_REVIEW';

    return {
      workspaceId,
      reviewer,
      reviewStatus: 'READY_FOR_REVIEW',
      shareUrl,
      sharedAt: new Date().toISOString(),
    };
  }

  async getWorkspace(workspaceId: string): Promise<ProjectWorkspaceRecord> {
    const workspace = this.workspaces.get(workspaceId);
    if (!workspace) {
      throw new NotFoundException(`Workspace ${workspaceId} was not found.`);
    }
    return workspace;
  }
}

