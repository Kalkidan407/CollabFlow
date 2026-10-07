import { Injectable } from '@nestjs/common';

export type ProjectStatus =
  | 'DRAFT'
  | 'READY_FOR_REVIEW'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'MISMATCH_FOUND';

export interface ProjectSpecification {
  overview: string;
  goals: string[];
  nonGoals?: string[];
  requirements: string[];
  architecture?: string;
  acceptanceCriteria: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  role?: string;
}

export interface Advisor {
  id: string;
  name: string;
  email?: string;
  approved?: boolean;
}

export interface ProjectIdea {
  id: string;
  problem: string;
  solution: string;
  stakeholders: string[];
  targetUsers: string[];
  submittedBy: string;
  createdAt: string;
  votes: number;
}

export interface ProjectDocumentationDraft {
  title: string;
  sections: {
    problemStatement: string;
    solutionOverview: string;
    stakeholders: string;
    targetUsers: string;
    requirementsSummary: string;
  };
}

export interface CreateProjectInput {
  workspaceId?: string;
  title: string;
  description?: string;
  repositoryUrl?: string;
  defaultBranch?: string;
  specification?: Partial<ProjectSpecification>;
  source?: 'draft' | 'imported';
  teamSize?: number;
  advisorName?: string;
  academicYear?: string;
  teamMembers?: string[];
  advisorEmail?: string;
  goal?: string;
  preferredStack?: string[];
}

export interface SubmitIdeaInput {
  problem: string;
  solution: string;
  stakeholders: string[];
  targetUsers: string[];
  submittedBy: string;
}

export interface ProjectBlueprint {
  projectId: string;
  goal: string;
  recommendedStack: string[];
  lifecycle: string[];
  outputFormats: string[];
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
      workspaceId: input.workspaceId ?? null,
      title: input.title,
      description: input.description ?? 'Specification-first project for architecture review and implementation validation.',
      status: 'DRAFT' as ProjectStatus,
      source: input.source ?? 'draft',
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
      ideas: [] as ProjectIdea[],
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
      review: null,
      advisor: {
        id: `advisor-${Date.now()}`,
        name: input.advisorName ?? 'Advisor',
        email: input.advisorEmail,
        approved: false,
      },
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

  importSpecification(projectId: string, specification: Partial<ProjectSpecification>) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    project.specification = this.normalizeSpecification(specification);
    project.source = 'imported';
    project.docs = [
      {
        id: `doc-${Date.now()}`,
        title: `${project.title} — imported specification`,
        type: 'SPECIFICATION',
        source: 'imported',
        content: this.renderSpecification(project.specification),
        createdAt: new Date().toISOString(),
      },
    ];

    return project;
  }

  submitIdea(projectId: string, input: SubmitIdeaInput) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const idea: ProjectIdea = {
      id: `idea-${Date.now()}`,
      problem: input.problem,
      solution: input.solution,
      stakeholders: input.stakeholders,
      targetUsers: input.targetUsers,
      submittedBy: input.submittedBy,
      createdAt: new Date().toISOString(),
      votes: 0,
    };

    project.ideas.push(idea);
    project.activity.push({
      type: 'IDEA_SUBMITTED',
      actor: input.submittedBy,
      message: `${input.submittedBy} submitted a specification idea for evaluation.`,
      createdAt: new Date().toISOString(),
    });

    return idea;
  }

  voteOnIdea(projectId: string, ideaId: string, voter: string) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const idea = project.ideas.find((item: ProjectIdea) => item.id === ideaId);
    if (!idea) {
      throw new Error('Idea not found');
    }

    idea.votes += 1;
    project.activity.push({
      type: 'IDEA_VOTED',
      actor: voter,
      message: `${voter} voted on a specification direction.`,
      createdAt: new Date().toISOString(),
    });

    return idea;
  }

  approveProject(projectId: string, advisorName: string) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    project.status = 'APPROVED';
    project.advisor.approved = true;
    project.advisor.name = advisorName || project.advisor.name;
    project.review = {
      reviewer: advisorName || project.advisor.name,
      reviewStatus: 'READY_FOR_REVIEW',
      shareUrl: `https://specflow.example/reviews/${project.id}`,
      sharedAt: new Date().toISOString(),
    };
    project.activity.push({
      type: 'PROJECT_APPROVED',
      actor: advisorName,
      message: `The project specification was approved and is ready for implementation review.`,
      createdAt: new Date().toISOString(),
    });

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

  shareProjectForReview(projectId: string, input: { reviewer: string }) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const reviewId = `review-${Date.now()}`;
    const shareUrl = `https://specflow.example/reviews/${reviewId}`;

    project.status = 'READY_FOR_REVIEW';
    project.review = {
      reviewer: input.reviewer,
      reviewStatus: 'READY_FOR_REVIEW',
      shareUrl,
      sharedAt: new Date().toISOString(),
    };

    project.activity.push({
      type: 'PROJECT_SHARED_FOR_REVIEW',
      actor: input.reviewer,
      message: `${input.reviewer} shared the specification for review.`,
      createdAt: new Date().toISOString(),
    });

    return {
      projectId,
      reviewer: input.reviewer,
      reviewStatus: 'READY_FOR_REVIEW',
      shareUrl,
      sharedAt: project.review.sharedAt,
    };
  }

  generateDocumentation(projectId: string): ProjectDocumentationDraft {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const specification = project.specification ?? this.normalizeSpecification();

    return {
      title: `${project.title} — Specification Draft`,
      sections: {
        problemStatement: `Problem / context: ${specification.overview}`,
        solutionOverview: `Architecture / proposal: ${specification.architecture ?? 'The product design is still being defined.'}`,
        stakeholders: `Goals: ${specification.goals.join(', ')}`,
        targetUsers: `Requirements: ${specification.requirements.join(', ')}`,
        requirementsSummary: `Acceptance criteria: ${specification.acceptanceCriteria.join('; ')}`,
      },
    };
  }

  generateProjectBlueprint(projectId: string): ProjectBlueprint {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const specification = project.specification ?? this.normalizeSpecification();
    const recommendedStack = this.getRecommendedStack(project.preferredStack ?? ['TypeScript', 'NestJS', 'GitHub']);
    const lifecycle = [
      'Define the product problem and the desired system behavior.',
      'Document the architecture, constraints, and required modules.',
      'Turn the specification into requirements and acceptance criteria.',
      'Connect the repo and check if implementation matches the written spec.',
      'Review the mismatch report and close gaps before release.',
    ];

    return {
      projectId,
      goal: project.goal ?? specification.overview,
      recommendedStack,
      lifecycle,
      outputFormats: ['Markdown', 'PDF', 'DOCX'],
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
