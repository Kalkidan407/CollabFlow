import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { createSecureId } from '../common/secure-id';

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

export interface SrsFieldDefinition {
  name: string;
  type: string;
  visibility?: 'public' | 'private' | 'protected';
  defaultValue?: string;
}

export interface SrsMethodDefinition {
  name: string;
  returnType?: string;
  parameters?: string[];
  visibility?: 'public' | 'private' | 'protected';
}

export interface SrsClassDefinition {
  name: string;
  stereotype?: 'Entity' | 'Boundary' | 'Control';
  fields: SrsFieldDefinition[];
  methods: SrsMethodDefinition[];
  relationships?: string[];
}

export interface SrsUseCaseDefinition {
  title: string;
  actors?: string[];
  preconditions?: string[];
  postConditions?: string[];
  mainFlow?: string[];
}

export interface SrsRequirementDefinition {
  id: string;
  description: string;
  constraints?: string[];
}

export interface ExtractedSrsEntities {
  requirements: SrsRequirementDefinition[];
  useCases: SrsUseCaseDefinition[];
  classes: SrsClassDefinition[];
}

export type WorkspaceSpecificationDraft = SpecificationDraft & {
  importedFrom?: string;
  extracted?: ExtractedSrsEntities;
};

export interface ProjectWorkspaceRecord {
  id: string;
  title: string;
  description?: string;
  source?: 'draft' | 'imported';
  repository?: RepositorySyncInfo | null;
  specification?: WorkspaceSpecificationDraft | null;
  reviewStatus?: 'READY_FOR_REVIEW' | 'IN_REVIEW' | 'APPROVED';
  reviewer?: string;
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

export interface IngestSrsDocumentInput {
  format: 'pdf' | 'docx' | 'markdown';
  fileName: string;
  content: string;
}

export interface ReviewExtractedEntitiesInput {
  requirements?: SrsRequirementDefinition[];
  useCases?: SrsUseCaseDefinition[];
  classes?: SrsClassDefinition[];
}

@Injectable()
export class WorkspacesService {
  private readonly workspaces = new Map<string, ProjectWorkspaceRecord>();

  constructor(private readonly prisma: PrismaService) {}

  async listWorkspaces(): Promise<ProjectWorkspaceRecord[]> {
    return Array.from(this.workspaces.values());
  }

  async createProjectWorkspace(data: CreateProjectWorkspaceInput): Promise<ProjectWorkspaceRecord> {
    const id = createSecureId('workspace');
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
      reviewer: 'Product team',
      shareUrl: `https://specflow.example/reviews/${id}`,
      projects: [],
      createdAt: now,
      updatedAt: now,
    };

    // Persist to the contract-backed DB and keep an in-memory cache
    try {
      const client = this.prisma.getClient();
      const plan = client.raw.sql`
        INSERT INTO "public"."Workspace" ("id","title","description","status","source","repositoryUrl","defaultBranch","reviewStatus","shareUrl")
        VALUES (${id}, ${data.title}, ${data.description ?? ''}, ${'DRAFT'}, ${data.source ?? 'draft'}, ${data.repositoryUrl ?? ''}, ${data.defaultBranch ?? ''}, ${workspace.reviewStatus}, ${workspace.shareUrl})
        RETURNING "id","title","description","status","source","repositoryUrl","defaultBranch","reviewStatus","shareUrl","createdAt","updatedAt"
      `.returnsRow({
        id: 'pg/text@1',
        title: 'pg/text@1',
        description: 'pg/text@1',
        status: 'pg/text@1',
        source: 'pg/text@1',
        repositoryUrl: 'pg/text@1',
        defaultBranch: 'pg/text@1',
        reviewStatus: 'pg/text@1',
        shareUrl: 'pg/text@1',
        createdAt: 'pg/timestamptz-temporal@1',
        updatedAt: 'pg/timestamptz-temporal@1',
      }).build();

      const rows = await client.runtime().query(plan);
      const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;

      if (row) {
        const persisted: ProjectWorkspaceRecord = {
          id: String(row.id),
          title: String(row.title),
          description: row.description ?? undefined,
          source: (row.source ?? workspace.source) as 'draft' | 'imported',
          repository: workspace.repository,
          specification: workspace.specification,
          reviewStatus: row.reviewStatus ?? workspace.reviewStatus,
          reviewer: workspace.reviewer,
          shareUrl: row.shareUrl ?? workspace.shareUrl,
          projects: [],
          createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
          updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
        };

        this.workspaces.set(id, persisted);
        return persisted;
      }
    } catch (err: unknown) {
      // Fall back to in-memory storage if DB write fails
      // Use safe cast because `err` is `unknown` in strict TS configs
      // eslint-disable-next-line no-console
      console.error('Workspace persistence error, keeping in-memory:', (err as any)?.message ?? err);
    }

    this.workspaces.set(id, workspace);
    return workspace;
  }

  async createProjectInWorkspace(workspaceId: string, input: Partial<CreateProjectWorkspaceInput> & { title: string }) {
    const workspace = await this.getWorkspace(workspaceId);

    const project = {
      id: createSecureId('project'),
      workspaceId,
      title: input.title,
      description: input.description ?? 'Project created inside the workspace.',
      status: 'DRAFT',
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

  async ingestSrsDocument(workspaceId: string, input: IngestSrsDocumentInput) {
    const workspace = await this.getWorkspace(workspaceId);
    const extracted = this.extractSrsEntities(input.content);

    workspace.source = 'imported';
    workspace.specification = {
      ...(workspace.specification ?? {
        overview: 'Imported specification from an SRS document.',
        goals: ['Capture the product intent described by the SRS'],
        requirements: extracted.requirements.map((item) => item.description),
        acceptanceCriteria: ['The document was reviewed and validated before scanning'],
      }),
      importedFrom: input.fileName,
      extracted,
    };

    workspace.reviewStatus = 'READY_FOR_REVIEW';
    workspace.updatedAt = new Date().toISOString();

    return {
      workspaceId,
      fileName: input.fileName,
      format: input.format,
      uploadedAt: new Date().toISOString(),
      extracted,
      reviewStatus: workspace.reviewStatus,
    };
  }

  async reviewExtractedEntities(workspaceId: string, input: ReviewExtractedEntitiesInput) {
    const workspace = await this.getWorkspace(workspaceId);
    const current = workspace.specification?.extracted ?? this.extractSrsEntities('');

    const next = {
      requirements: input.requirements ?? current.requirements,
      useCases: input.useCases ?? current.useCases,
      classes: input.classes ?? current.classes,
    };

    workspace.specification = {
      ...(workspace.specification ?? {
        overview: 'Reviewed specification',
        goals: ['Confirm the extracted SRS entities'],
        requirements: next.requirements.map((item) => item.description),
        acceptanceCriteria: ['The extracted requirements and classes were reviewed'],
      }),
      extracted: next,
    };

    workspace.reviewStatus = 'IN_REVIEW';
    workspace.updatedAt = new Date().toISOString();

    return next;
  }

  async importSpecification(workspaceId: string, specification: Partial<SpecificationDraft> & { importedFrom?: string }) {
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
    const assignedReviewer = reviewer || 'Product team';

    workspace.reviewer = assignedReviewer;
    workspace.reviewStatus = 'IN_REVIEW';
    workspace.shareUrl = shareUrl;

    return {
      workspaceId,
      reviewer: assignedReviewer,
      reviewStatus: 'IN_REVIEW',
      shareUrl,
      sharedAt: new Date().toISOString(),
    };
  }

  private extractSrsEntities(content: string): ExtractedSrsEntities {
    const normalized = content.replace(/\r/g, '');
    const lines = normalized.split('\n').map((line) => line.trim()).filter(Boolean);

    const requirements = lines
      .flatMap((line) => {
        const match = line.match(/(?:^|\s)([A-Z]+-\d+)\s*[:\-]\s*(.+)$/i);
        return match ? [{ id: match[1].toUpperCase(), description: match[2].trim(), constraints: [] }] : [];
      })
      .slice(0, 10);

    const useCases = lines
      .flatMap((line) => {
        const match = line.match(/(?:use case|Use Case)\s*[:\-]?\s*(.+)$/i);
        return match ? [{ title: match[1].trim(), mainFlow: [match[1].trim()] }] : [];
      })
      .slice(0, 10);

    const classes: SrsClassDefinition[] = lines
      .flatMap((line): SrsClassDefinition[] => {
        const classMatch = line.match(/(?:class|Class)\s*[:\-]?\s*([A-Z][A-Za-z0-9_]*)\s*(?:\{([^}]*)\})?/);
        if (!classMatch) {
          return [];
        }

        const name = classMatch[1];
        const body = classMatch[2] ?? '';
        const fields: SrsFieldDefinition[] = [...body.matchAll(/([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([A-Za-z0-9_<>,\[\]\?]+)(?:\s*=\s*([^;]+))?/g)].map((match): SrsFieldDefinition => ({
          name: match[1],
          type: match[2].trim(),
          visibility: 'private',
          defaultValue: match[3]?.trim(),
        }));

        const methods: SrsMethodDefinition[] = [...body.matchAll(/([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)\s*(?::\s*([A-Za-z0-9_<>,\[\]\?]+))?/g)].map((match): SrsMethodDefinition => ({
          name: match[1],
          parameters: match[2].trim() ? match[2].split(',').map((part) => part.trim()).filter(Boolean) : [],
          returnType: match[3]?.trim() || 'void',
          visibility: 'public',
        }));

        return [{
          name,
          stereotype: 'Entity' as const,
          fields,
          methods,
          relationships: line.includes('extends') ? ['extends'] : [],
        }];
      })
      .slice(0, 10);

    const fallbackClass: SrsClassDefinition = {
      name: 'DomainEntity',
      stereotype: 'Entity',
      fields: [],
      methods: [],
      relationships: [],
    };

    return {
      requirements:
        requirements.length > 0
          ? requirements
          : [{ id: 'FR-01', description: 'Primary requirement extracted from the SRS document.', constraints: [] }],
      useCases: useCases.length > 0 ? useCases : [{ title: 'Primary use case identified from the SRS document.' }],
      classes: classes.length > 0 ? classes : [fallbackClass],
    };
  }

  async getWorkspace(workspaceId: string): Promise<ProjectWorkspaceRecord> {
    const cached = this.workspaces.get(workspaceId);
    if (cached) return cached;

    // Try to load from DB when not cached
    try {
      const client = this.prisma.getClient();
      const plan = client.raw.sql`
        SELECT "id","title","description","status","source","repositoryUrl","defaultBranch","reviewStatus","shareUrl","createdAt","updatedAt"
        FROM "public"."Workspace" WHERE "id" = ${workspaceId}
      `.returnsRow({
        id: 'pg/text@1',
        title: 'pg/text@1',
        description: 'pg/text@1',
        status: 'pg/text@1',
        source: 'pg/text@1',
        repositoryUrl: 'pg/text@1',
        defaultBranch: 'pg/text@1',
        reviewStatus: 'pg/text@1',
        shareUrl: 'pg/text@1',
        createdAt: 'pg/timestamptz-temporal@1',
        updatedAt: 'pg/timestamptz-temporal@1',
      }).build();

      const rows = await client.runtime().query(plan);
      const row = Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
      if (!row) throw new NotFoundException(`Workspace ${workspaceId} was not found.`);

      const loaded: ProjectWorkspaceRecord = {
        id: String(row.id),
        title: String(row.title),
        description: row.description ?? undefined,
        source: (row.source ?? 'draft') as 'draft' | 'imported',
        repository: undefined,
        specification: null,
        reviewStatus: row.reviewStatus ?? undefined,
        reviewer: undefined,
        shareUrl: row.shareUrl ?? undefined,
        projects: [],
        createdAt: row.createdAt instanceof Date ? row.createdAt.toISOString() : String(row.createdAt),
        updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : String(row.updatedAt),
      };

      this.workspaces.set(workspaceId, loaded);
      return loaded;
    } catch (err) {
      // If DB access fails, preserve existing behavior
      throw new NotFoundException(`Workspace ${workspaceId} was not found.`);
    }
  }
  
}

