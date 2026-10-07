# SpecFlow

SpecFlow is a specification-first engineering tool for teams that want to define software requirements clearly, import existing documentation when it already exists, and compare the written spec against the actual repository implementation.

The system helps teams turn product intent into structured documentation, connect that document to a Git repository, and highlight architecture or requirement mismatches before the implementation drifts too far.

## Product Vision

Engineering teams often struggle with:

* vague product requirements and architecture documents
* docs that do not match the codebase
* manual review loops that slow delivery
* no simple way to compare implementation against the original specification

SpecFlow solves these problems by providing a document-driven workflow: create a project, draft or import a specification, connect the Git repository, and review repository mismatch reports before shipping.

## Core Features

* Create a project as a specification workspace
* Draft a software specification in the app
* Import an existing doc or requirements file
* Connect the project to a Git repository
* Compare implementation against written product intent
* Highlight architecture and requirement mismatches
* Share the project for review with a public review link
* Export the specification as a generated documentation draft

## Main User Flow

```text
Create Project
     ↓
Write or Import Specification
     ↓
Connect Git Repository
     ↓
Check Implementation Against Spec
     ↓
Review Mismatch Report
     ↓
Share for Review
     ↓
Align Code and Documentation
```

## Main Entities

### Project
Represents a specification workspace and source of truth for a product or initiative.

Fields include:

* id
* title
* description
* status
* repositoryUrl
* defaultBranch
* specification
* createdAt
* updatedAt

### Specification
Represents the written product and architecture intent.

Fields include:

* overview
* goals
* nonGoals
* requirements
* architecture
* acceptanceCriteria

### RepositoryConnection
Represents the Git repo that will be validated against the specification.

Fields include:

* provider
* url
* defaultBranch
* lastSyncedAt

### ProjectReview
Represents a shareable review snapshot for stakeholders.

Fields include:

* reviewer
* summary
* status
* shareUrl
* createdAt

### SpecificationMismatch
Represents a configuration, requirement, or implementation gap discovered during validation.

Fields include:

* category
* severity
* message
* filePath

## Architecture

```text
Web App / API
   │
   ▼
NestJS API
   │
   ├── Project Module
   ├── Specification Module
   ├── Repository Sync Module
   ├── Validation / Mismatch Checker
   └── Review Sharing Module
   │
   ▼
Prisma + Postgres
```

## Technology Stack

**Backend**

* NestJS
* TypeScript
* Prisma
* PostgreSQL

**Future UI**

* Next.js
* React
* VS Code extension for in-editor spec validation
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
