# CollabFlow

CollabFlow is a collaborative software-engineering platform designed for final-year computer science and software engineering students. The platform helps student teams manage the full software development lifecycle from problem discovery through project approval, sprint planning, implementation, testing, and final documentation.

The system supports team collaboration, advisor review, structured project history, and documentation generation in a single workflow.

## Product Vision

Students working on final-year projects often struggle with:

* unclear project discovery and idea validation
* poor coordination among team members
* weak communication with advisors
* lack of sprint planning and progress tracking
* inconsistent documentation and final deliverables

CollabFlow solves these problems by guiding project teams through a structured lifecycle, while enabling advisors to review progress, provide feedback, and approve milestones.

## Core Features

* Google sign-in and user profile management
* Project creation and team membership setup
* Invitation flow for team members and advisors
* Problem discovery and idea submission
* Stakeholder and target-user analysis
* Team discussion and voting on project ideas
* Advisor review, comments, and approval workflow
* Requirement definition with user stories and acceptance criteria
* Product backlog and sprint planning
* Task assignment and team-role breakdown
* Progress tracking for design, frontend, backend, QA, and documentation work
* Project activity and decisions history
* Documentation generation for software project drafts
* Testing and launch milestone tracking

## Main User Flow

```text
Create Project
     ↓
Invite Team Members + Advisor
     ↓
Submit Project Ideas
     ↓
Discuss, Review, and Vote
     ↓
Send Approved Idea to Advisor
     ↓
Advisor Comments / Approval / Changes Requested
     ↓
Requirements and Planning
     ↓
Sprint Setup and Task Assignment
     ↓
Implementation and Team Execution
     ↓
Testing and Validation
     ↓
Documentation Generation
     ↓
Launch / Final Project Milestone
```

## Main Entities

### User
Represents a team member or advisor in the system.

Fields include:

* id
* name
* email
* googleId
* avatarUrl
* bio
* createdAt
* updatedAt

### Project
Represents a final-year software project.

Fields include:

* id
* title
* description
* teamSize
* academicYear
* status
* advisor
* members
* createdAt
* updatedAt

### Advisor
Represents the project supervisor or reviewer.

Fields include:

* id
* name
* email
* department
* reviews

### ProjectIdea
Represents a proposed solution or problem statement submitted by a student team.

Fields include:

* id
* problem
* solution
* stakeholders
* targetUsers
* submittedBy
* votes
* status
* createdAt

### Requirement
Represents requirements for the project workflow.

Fields include:

* id
* title
* description
* userStories
* acceptanceCriteria
* priority
* type

### Sprint
Represents an iteration or milestone stage in the project timeline.

Fields include:

* id
* name
* goal
* startDate
* endDate
* status
* tasks

### Task
Represents a unit of work assigned to a team member or team.

Fields include:

* id
* title
* description
* assignee
* status
* priority

### ProjectDocument
Represents generated documentation based on project activity and development history.

Fields include:

* id
* title
* content
* generatedAt

## System Roles

The platform supports multiple roles within a project, including:

* Team member
* Team lead
* Frontend developer
* Backend developer
* Designer
* Tester
* Quality controller
* Documentation lead
* Advisor

These roles help the team work in parallel and keep each member focused on the correct part of the lifecycle.

## Architecture

```text
Client App
   │
   ▼
NestJS API
   │
   ├── Auth Module
   ├── Project Module
   ├── Idea and Voting Module
   ├── Advisor Review Module
   ├── Planning Module
   ├── Sprint and Task Module
   ├── Activity History Module
   └── Documentation Module
   │
   ▼
PostgreSQL Database
   │
   ▼
Prisma ORM
```

## Technology Stack

**Frontend**

* Next.js
* TypeScript
* Tailwind CSS

**Backend**

* NestJS
* TypeScript
* REST API
* Swagger

**Database**

* PostgreSQL
* Prisma ORM

**Deployment**

* Vercel or similar frontend hosting
* Render, Railway, or similar app hosting
* Neon or Postgres cloud provider

## Example Project Scenario

```text
Create Project
Project: Smart Campus Transportation System
Team: 5 students
Advisor: Dr. Abebe
Academic Year: 2026/27
```

The team then:

1. invites all members and the advisor
2. submits project ideas with problem statements, stakeholders, and target users
3. discusses the ideas and votes on the best proposal
4. sends it to the advisor for review
5. receives comments and either approval or requested changes
6. defines requirements, backlog, and sprint plan
7. assigns tasks to specialized team members
8. implements and tracks progress
9. generates project documentation from the team activity and outcomes

## Project Structure

```text
who_whome/
├── src/
│   ├── app.module.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   ├── projects/
│   │   ├── projects.controller.ts
│   │   ├── projects.module.ts
│   │   └── projects.service.ts
│   ├── prisma/
│   │   ├── contract.prisma
│   │   ├── db.ts
│   │   └── prisma.service.ts
│   └── main.ts
├── test/
├── README.md
├── package.json
├── prisma.config.ts
├── tsconfig.json
└── .env
```

## Status

🚧 **In Development**

This project is being evolved from the original game-room concept into a software project collaboration platform for academic teams.
