

export class User {
  id: string;
  name: string;
  roomCode?: string;
  projectId?: string;
  roomId?: string;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Project {
  id: string;
  title: string;
  description?: string;
  status: 'IDEATION' | 'ACTIVE' | 'APPROVED' | 'IN_PROGRESS' | 'TESTING' | 'MAINTENANCE';
  createdAt: Date;
  updatedAt: Date;
}

export class Room {
  id: string;
  code: string;
  title: string;
  description?: string;
  history?: string;
  srcDoc?: string;
  sof?: string;
  status: 'WAITING' | 'IDEATION' | 'IN_PROGRESS' | 'APPROVED' | 'FINISHED';
  projectId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Task {
  id: string;
  roomId: string;
  projectId?: string;
  title: string;
  description?: string;
  assigneeId?: string;
  assignerId?: string;
  status: 'ONGOING' | 'FINISHED' | 'REVIEW' | 'BLOCKED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: Date;
}

export class Comment {
  id: string;
  userId: string;
  roomId?: string;
  taskId?: string;
  comment: string;
  reply?: string;
  createdAt: Date;
}

export class Schedule {
  id: string;
  roomId: string;
  title: string;
  sprintName?: string;
  timeline?: string;
  startAt?: Date;
  endAt?: Date;
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED';
  createdAt: Date;
}

export class LifecycleStage {
  id: string;
  roomId: string;
  name: 'USE_CASE' | 'REQUIREMENTS' | 'USER_STORIES' | 'PRODUCT_BACKLOG' | 'SYSTEM_DESIGN' | 'SPRINT_PLANNING' | 'DEVELOPMENT' | 'TESTING' | 'REVIEW' | 'DEPLOYMENT' | 'MAINTENANCE';
  order: number;
  status: 'PENDING' | 'ACTIVE' | 'DONE';
  notes?: string;
  createdAt: Date;
}
