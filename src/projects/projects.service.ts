import { Injectable } from '@nestjs/common';

export type ProjectStatus =
  | 'IDEATION'
  | 'VOTING'
  | 'ADVISOR_REVIEW'
  | 'APPROVED'
  | 'PLANNING'
  | 'IN_PROGRESS'
  | 'TESTING'
  | 'LAUNCHED';

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
  title: string;
  teamSize: number;
  advisorName: string;
  academicYear: string;
  teamMembers?: string[];
  advisorEmail?: string;
}

export interface SubmitIdeaInput {
  problem: string;
  solution: string;
  stakeholders: string[];
  targetUsers: string[];
  submittedBy: string;
}

@Injectable()
export class ProjectsService {
  private projects = new Map<string, any>();

  createProject(input: CreateProjectInput) {
    const id = `project-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const project = {
      id,
      title: input.title,
      teamSize: input.teamSize,
      academicYear: input.academicYear,
      status: 'IDEATION' as ProjectStatus,
      advisor: {
        id: `advisor-${Date.now()}`,
        name: input.advisorName,
        email: input.advisorEmail,
        approved: false,
      },
      teamMembers: (input.teamMembers ?? []).map((member, index) => ({
        id: `member-${index + 1}`,
        name: member,
        role: 'Team member',
      })),
      ideas: [] as ProjectIdea[],
      activity: [
        {
          type: 'PROJECT_CREATED',
          actor: 'System',
          message: `${input.title} was created and the team started the discovery workflow.`,
          createdAt: new Date().toISOString(),
        },
      ],
      decisions: [],
      sprintPlan: [],
      createdAt: new Date().toISOString(),
    };

    this.projects.set(id, project);
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
      message: `${input.submittedBy} submitted a project idea for review.`,
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
      message: `${voter} voted for an idea in the project discovery phase.`,
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
    project.activity.push({
      type: 'PROJECT_APPROVED',
      actor: advisorName,
      message: `The advisor approved the project concept and moved it into planning.`,
      createdAt: new Date().toISOString(),
    });

    return project;
  }

  generateDocumentation(projectId: string): ProjectDocumentationDraft {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error('Project not found');
    }

    const leadingIdea = project.ideas[0] ?? {
      problem: 'The project problem has not been defined yet.',
      solution: 'The team is still defining the solution approach.',
      stakeholders: ['Project team'],
      targetUsers: ['End users'],
    };

    const requirementsSummary =
      'The platform will guide the team through idea discovery, advisor review, planning, implementation, testing, and final documentation generation for a collaborative final-year project workflow.';

    return {
      title: `${project.title} — Project Documentation Draft`,
      sections: {
        problemStatement: `Problem: ${leadingIdea.problem}`,
        solutionOverview: `Solution: ${leadingIdea.solution}`,
        stakeholders: `Stakeholders: ${leadingIdea.stakeholders.join(', ')}`,
        targetUsers: `Target users: ${leadingIdea.targetUsers.join(', ')}`,
        requirementsSummary,
      },
    };
  }

  getProject(projectId: string) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error('Project not found');
    }
    return project;
  }
}
