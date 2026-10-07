import { WorkspacesService } from './workspaces.service.js';

describe('WorkspacesService', () => {
  it('extracts requirements and classes from uploaded SRS content', async () => {
    const service = new WorkspacesService({ getClient: () => ({}) } as any);
    const workspace = await service.createProjectWorkspace({
      title: 'Library System',
      overview: 'A digital library management system from the SRS document.',
      requirements: ['FR-01 Login', 'FR-02 Borrow book'],
      acceptanceCriteria: ['Users can log in', 'Books can be borrowed'],
    });

    const result = await service.ingestSrsDocument(workspace.id, {
      format: 'markdown',
      fileName: 'srs.md',
      content: [
        '# Library System SRS',
        '',
        '## Requirements',
        '- FR-01: Users can log in with email and password.',
        '- FR-02: Members can borrow a book.',
        '',
        '## Domain Model',
        '- Class: User { email: String; password: String; login(): boolean }',
        '- Class: Book { isbn: String; title: String; borrow(): boolean }',
      ].join('\n'),
    });

    expect(result.extracted.requirements.length).toBeGreaterThanOrEqual(2);
    expect(result.extracted.classes.some((item) => item.name === 'User')).toBe(true);
  });

  it('allows a reviewer to override extracted SRS entities', async () => {
    const service = new WorkspacesService({ getClient: () => ({}) } as any);
    const workspace = await service.createProjectWorkspace({
      title: 'Review Workspace',
    });

    await service.ingestSrsDocument(workspace.id, {
      format: 'markdown',
      fileName: 'review.md',
      content: 'FR-01: Users can sign in. Class: Account { email: String }',
    });

    const updated = await service.reviewExtractedEntities(workspace.id, {
      classes: [{ name: 'Account', fields: [{ name: 'email', type: 'String', visibility: 'private' }] }],
    });

    expect(updated.classes[0].name).toBe('Account');
    expect(updated.classes[0].fields[0].name).toBe('email');
  });
});
