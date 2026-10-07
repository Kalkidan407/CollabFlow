import { Injectable } from '@nestjs/common';

export type ProjectStatus =
  | 'DRAFT'
  | 'READY_FOR_REVIEW'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'MISMATCH_FOUND';

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
  postconditions?: string[];
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

export interface ProjectSpecification {
  overview: string;
  goals: string[];
  nonGoals?: string[];
  requirements: string[];
  architecture?: string;
  acceptanceCriteria: string[];
  importedFrom?: string;
  extracted?: ExtractedSrsEntities;
}

export interface TeamMember {
  id: string;
  name: string;
  role?: string;
}

export interface CreateProjectInput {
  workspaceId?: string;
  title: string;
  description?: string;
  repositoryUrl?: string;
  defaultBranch?: string;
  specification?: Partial<ProjectSpecification>;
  source?: 'draft' | 'imported';
  visibility?: 'public' | 'private';
  teamSize?: number;
  academicYear?: string;
  teamMembers?: string[];
  goal?: string;
  preferredStack?: string[];
}

export interface RepositoryConnection {
  provider: 'github' | 'gitlab' | 'azure-devops';
  url: string;
  defaultBranch: string;
  files: string[];
  lastSyncedAt: string;
}

export interface MismatchFinding {
  category: 'architecture' | 'requirements' | 'repository';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  filePath?: string;
}

@Injectable()
export class ProjectsService {
  private projects = new Map<string, any>();

  createProject(input: CreateProjectInput) {
    const id = `project-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const specification = this.normalizeSpecification(input.specification);
    const repository = input.repositoryUrl
      ? {
          provider: 'github',
          url: input.repositoryUrl,
          defaultBranch: input.defaultBranch ?? 'main',
          files: [],
          lastSyncedAt: new Date().toISOString(),
        }
      : null;

    const project = {
      id,
      shareCode: `proj-${Math.random().toString(36).slice(2, 10)}`,
      workspaceId: input.workspaceId ?? null,
      title: input.title,
      description: input.description ?? 'Specification-first project for architecture review and implementation validation.',
      status: 'DRAFT' as ProjectStatus,
      source: input.source ?? 'draft',
      visibility: input.visibility ?? 'private',
      repository,
      specification,
      docs: [
        {
          id: `doc-${Date.now()}`,
          title: `${input.title} — specification`,
          type: 'SPECIFICATION',
          source: input.source ?? 'draft',
          content: this.renderSpecification(specification),
          createdAt: new Date().toISOString(),
        },
      ],
      activity: [
        {
          type: 'PROJECT_CREATED',
          actor: 'System',
          message: `${input.title} was created for specification drafting and repo validation.`,
          createdAt: new Date().toISOString(),
        },
      ],
      decisions: [],
      sprintPlan: [],
      createdAt: new Date().toISOString(),
      teamSize: input.teamSize ?? 0,
      academicYear: input.academicYear ?? 'TBD',
      goal: input.goal ?? specification.overview,
      preferredStack: (input.preferredStack ?? ['TypeScript', 'NestJS', 'GitHub']).filter(Boolean),
      teamMembers: (input.teamMembers ?? []).map((member, index) => ({
        id: `member-${index + 1}`,
        name: member,
        role: 'Contributor',
      })),
    };

    this.projects.set(id, project);
    return project;
  }

  connectRepository(projectId: string, repo: { provider?: string; url: string; defaultBranch?: string; files?: string[] }) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    project.repository = {
      provider: (repo.provider as any) ?? 'github',
      url: repo.url,
      defaultBranch: repo.defaultBranch ?? 'main',
      files: repo.files ?? [],
      lastSyncedAt: new Date().toISOString(),
    };
    return project.repository;
  }

  checkImplementationAgainstSpec(projectId: string, repoFiles: string[], additionalContext?: string) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const normalizedFiles = (repoFiles ?? []).map((file) => file.toLowerCase());
    const mismatches: MismatchFinding[] = [];
    const requirementText = [
      ...(project.specification.requirements ?? []),
      project.specification.architecture ?? '',
      additionalContext ?? '',
    ]
      .join(' ')
      .toLowerCase();

    if (requirementText.includes('sync') && !normalizedFiles.some((file) => file.includes('sync') || file.includes('repo') || file.includes('integration'))) {
      mismatches.push({
        category: 'repository',
        severity: 'warning',
        message: 'The specification mentions repository sync or integration work, but no matching implementation files were found in the repo.',
        filePath: 'repository',
      });
    }

    if (!normalizedFiles.length) {
      mismatches.push({
        category: 'repository',
        severity: 'critical',
        message: 'The repository is empty or no implementation files were connected for validation.',
        filePath: 'repository',
      });
    }

    if (project.specification.acceptanceCriteria?.length && project.specification.acceptanceCriteria.length > 0 && project.status !== 'APPROVED') {
      project.status = mismatches.length > 0 ? 'MISMATCH_FOUND' : 'READY_FOR_REVIEW';
    }

    return {
      projectId,
      summary: `Specification review completed for ${project.title}. ${mismatches.length} mismatch(es) identified against the written specification.`,
      mismatches,
      checkedAt: new Date().toISOString(),
    };
  }

  ingestSrsDocument(
    projectId: string,
    input: { format: 'pdf' | 'docx' | 'markdown'; fileName: string; content: string }
  ) {
    const project = this.getProject(projectId);
    const extracted = this.extractSrsEntities(input.content);
    const requirementDescriptions = extracted.requirements.map((item) => item.description);

    project.specification = {
      ...this.normalizeSpecification(project.specification),
      overview: project.specification?.overview ?? 'The project specification was extracted from an uploaded SRS document.',
      goals:
        project.specification?.goals?.length
          ? project.specification.goals
          : ['Capture the product intent described in the SRS', 'Translate the SRS into an implementation-ready project spec'],
      requirements: requirementDescriptions.length > 0 ? requirementDescriptions : project.specification.requirements,
      importedFrom: input.fileName,
      extracted,
      acceptanceCriteria:
        project.specification?.acceptanceCriteria?.length
          ? project.specification.acceptanceCriteria
          : ['The extracted SRS entities were reviewed and attached to the project', 'The project can be used as the review target for implementation checks'],
    };

    project.source = 'imported';
    project.status = 'READY_FOR_REVIEW';
    project.docs.push({
      id: `doc-${Date.now()}`,
      title: `${project.title} — imported SRS`,
      type: 'SRS_DOCUMENT',
      source: 'imported',
      content: this.renderSpecification(project.specification),
      createdAt: new Date().toISOString(),
    });

    project.activity.push({
      type: 'SRS_IMPORTED',
      actor: 'System',
      message: `The SRS document ${input.fileName} was uploaded and its requirements and entities were extracted into the project.`,
      createdAt: new Date().toISOString(),
    });

    return {
      projectId,
      fileName: input.fileName,
      format: input.format,
      uploadedAt: new Date().toISOString(),
      extracted,
      specification: project.specification,
    };
  }

  private normalizeSpecification(input?: Partial<ProjectSpecification>): ProjectSpecification {
    const specification = input ?? {};

    return {
      overview: specification.overview ?? 'Define the product intent, required architecture, and implementation constraints.',
      goals: specification.goals ?? ['Document the product vision', 'Align engineering work to the written specification'],
      nonGoals: specification.nonGoals ?? ['Track sprint tasks', 'Replace GitHub as the source of truth'],
      requirements: specification.requirements ?? ['Capture what the product must do', 'Describe architecture and expected behavior'],
      architecture: specification.architecture ?? 'Document the core modules, integrations, and quality constraints.',
      acceptanceCriteria: specification.acceptanceCriteria ?? ['The design is clearly written', 'The implementation can be compared to the spec'],
      importedFrom: specification.importedFrom,
      extracted: specification.extracted,
    };
  }

  private extractSrsEntities(content: string): ExtractedSrsEntities {
    const normalized = content.replace(/\r/g, '');
    const lines = normalized.split('\n').map((line) => line.trim()).filter(Boolean);

    const requirements = lines
      .flatMap((line): SrsRequirementDefinition[] => {
        const match = line.match(/(?:^|\s)([A-Z]+-\d+)\s*[:\-]\s*(.+)$/i);
        return match ? [{ id: match[1].toUpperCase(), description: match[2].trim(), constraints: [] }] : [];
      })
      .slice(0, 10);

    const useCases = lines
      .flatMap((line): SrsUseCaseDefinition[] => {
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

    return {
      requirements:
        requirements.length > 0
          ? requirements
          : [{ id: 'FR-01', description: 'Primary requirement extracted from the uploaded SRS document.', constraints: [] }],
      useCases: useCases.length > 0 ? useCases : [{ title: 'Primary use case identified from the uploaded SRS document.' }],
      classes: classes.length > 0 ? classes : [{ name: 'DomainEntity', stereotype: 'Entity', fields: [], methods: [], relationships: [] }],
    };
  }

  private renderSpecification(specification: ProjectSpecification) {
    return [
      '# Product Specification',
      '',
      `## Overview\n${specification.overview}`,
      '',
      `## Goals\n${specification.goals.map((goal) => `- ${goal}`).join('\n')}`,
      '',
      `## Non-goals\n${specification.nonGoals?.map((item) => `- ${item}`).join('\n') ?? '- Not defined yet'}`,
      '',
      `## Requirements\n${specification.requirements.map((item) => `- ${item}`).join('\n')}`,
      '',
      `## Architecture\n${specification.architecture ?? 'Not defined yet'}`,
      '',
      `## Acceptance criteria\n${specification.acceptanceCriteria.map((item) => `- ${item}`).join('\n')}`,
    ].join('\n');
  }

  private getRecommendedStack(preferred: string[]): string[] {
    if (preferred.length > 0) {
      return preferred;
    }

    return ['TypeScript', 'NestJS', 'GitHub'];
  }

  getProject(projectId: string) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error('Project not found');
    }
    return project;
  }
}
