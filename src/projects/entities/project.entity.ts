

export class User {
  id: string;
  googleId?: string;
  email: string;
  name: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Advisor {
  id: string;
  name: string;
  email: string;
  department?: string;
  createdAt: Date;
}

export class ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: string;
  joinedAt: Date;
}

export class Project {
  id: string;
  title: string;
  description?: string;
  teamSize: number;
  academicYear: string;
  status: 'IDEATION' | 'VOTING' | 'ADVISOR_REVIEW' | 'APPROVED' | 'PLANNING' | 'IN_PROGRESS' | 'TESTING' | 'LAUNCHED';
  advisorId?: string;
  advisor?: Advisor;
  createdAt: Date;
  updatedAt: Date;
}

export class ProjectIdea {
  id: string;
  projectId: string;
  submittedById: string;
  title?: string;
  problem: string;
  solution: string;
  stakeholders: string[];
  targetUsers: string[];
  description?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
}

export class IdeaVote {
  id: string;
  ideaId: string;
  voterId: string;
  createdAt: Date;
}

export class AdvisorReview {
  id: string;
  projectId: string;
  advisorId: string;
  status: 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED';
  comments?: string;
  suggestions?: string;
  approvedAt?: Date;
  createdAt: Date;
}

export class Requirement {
  id: string;
  projectId: string;
  title: string;
  description: string;
  userStories: string[];
  acceptanceCriteria: string[];
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  type: 'FUNCTIONAL' | 'NON_FUNCTIONAL';
  createdAt: Date;
}

export class Sprint {
  id: string;
  projectId: string;
  name: string;
  goal?: string;
  startDate?: Date;
  endDate?: Date;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED';
  createdAt: Date;
}

export class Task {
  id: string;
  sprintId?: string;
  projectId?: string;
  title: string;
  description?: string;
  assigneeId?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: Date;
}

export class ProjectActivity {
  id: string;
  projectId: string;
  actor: string;
  action: string;
  details?: string;
  createdAt: Date;
}

export class ProjectDocument {
  id: string;
  projectId: string;
  title: string;
  content: string;
  generatedAt: Date;
}
