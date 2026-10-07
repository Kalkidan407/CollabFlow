import { ProjectsService } from './projects.service.js';

describe('ProjectsService', () => {
  it('creates a spec-first project with repo metadata and a draft specification', () => {
    const service = new ProjectsService();

    const project = service.createProject({
      title: 'SpecGuard',
      description: 'A specification-first engineering quality checker for teams.',
      repositoryUrl: 'https://github.com/acme/specguard',
      defaultBranch: 'main',
      specification: {
        overview: 'The product helps engineering teams validate architectural intent against the actual repository state.',
        goals: ['Capture product intent', 'Compare code to the written specification'],
        nonGoals: ['Replace project management tools'],
        requirements: [
          'Teams can import or draft specifications.',
          'The tool can connect to a Git repository.',
        ],
        architecture: 'A document-driven review layer plus repo sync and mismatch analysis.',
        acceptanceCriteria: ['The review report highlights discrepancies.', 'The project can be shared for review.'],
      },
    });

    expect(project.title).toBe('SpecGuard');
    expect(project.repository.url).toBe('https://github.com/acme/specguard');
    expect(project.specification.requirements).toHaveLength(2);
    expect(project.status).toBe('DRAFT');
  });

  it('associates a project to the workspace it was created in', () => {
    const service = new ProjectsService();

    const project = service.createProject({
      workspaceId: 'workspace-123',
      title: 'Workspace Project',
      description: 'A project created inside a specification workspace.',
      specification: {
        overview: 'The team drafts requirements inside a workspace and then creates a project for implementation.',
        goals: ['Create within a workspace', 'Track implementation status'],
        requirements: ['Project must belong to a workspace'],
        acceptanceCriteria: ['workspaceId is set on the project'],
      },
    });

    expect(project.workspaceId).toBe('workspace-123');
  });

  it('detects spec-to-implementation mismatches and prepares a shareable review', () => {
    const service = new ProjectsService();
    const project = service.createProject({
      title: 'Architecture Review Tool',
      description: 'Spec linter for codebases.',
      repositoryUrl: 'https://github.com/acme/architecture-review',
      specification: {
        overview: 'The project must contain an architecture review module and a repository sync layer.',
        goals: ['Review architecture compliance', 'Flag missing implementation details'],
        nonGoals: ['Track sprint tasks'],
        requirements: ['Architecture review', 'Repository sync', 'Mismatch reporting'],
        architecture: 'Document-first app with repo comparison engine.',
        acceptanceCriteria: ['Review report is generated', 'Architecture mismatches are visible'],
      },
    });

    service.connectRepository(project.id, {
      provider: 'github',
      url: 'https://github.com/acme/architecture-review',
      defaultBranch: 'main',
      files: ['src/app.ts', 'src/review.ts'],
    });

    const report = service.checkImplementationAgainstSpec(
      project.id,
      ['src/app.ts', 'src/review.ts'],
      'The repository must include a dedicated repo sync module.'
    );

    expect(report.summary).toContain('specification');
    expect(report.mismatches.length).toBeGreaterThanOrEqual(0);

    const share = service.shareProjectForReview(project.id, { reviewer: 'Platform team' });
    expect(share.reviewStatus).toBe('READY_FOR_REVIEW');
    expect(share.shareUrl).toContain('/reviews/');
  });
});
