import { ProjectsService } from './projects.service.js';

describe('ProjectsService', () => {
  it('creates a project with the provided collaboration setup', () => {
    const service = new ProjectsService();

    const project = service.createProject({
      title: 'Smart Campus Transportation System',
      teamSize: 5,
      advisorName: 'Dr. Abebe',
      academicYear: '2026/27',
      teamMembers: ['Alem', 'Biruk', 'Chala', 'Dawit', 'Ephrem'],
      advisorEmail: 'abebe@university.edu',
    });

    expect(project.title).toBe('Smart Campus Transportation System');
    expect(project.teamMembers).toHaveLength(5);
    expect(project.status).toBe('IDEATION');
    expect(project.advisor.name).toBe('Dr. Abebe');
  });

  it('generates a project documentation draft from project history', () => {
    const service = new ProjectsService();
    const project = service.createProject({
      title: 'Smart Campus Transportation System',
      teamSize: 5,
      advisorName: 'Dr. Abebe',
      academicYear: '2026/27',
      teamMembers: ['Alem', 'Biruk'],
    });

    service.submitIdea(project.id, {
      problem: 'Students struggle to find reliable transport to campus during peak hours.',
      solution: 'A real-time tracking and route planning platform for students and drivers.',
      stakeholders: ['Students', 'Drivers', 'Campus administration'],
      targetUsers: ['Undergraduate students', 'Campus visitors'],
      submittedBy: 'Alem',
    });

    const doc = service.generateDocumentation(project.id);
    expect(doc.title).toContain('Smart Campus Transportation System');
    expect(doc.sections.problemStatement).toContain('Students struggle');
  });
});
