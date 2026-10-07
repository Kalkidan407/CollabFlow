import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  WorkspacesService,
  type IngestSrsDocumentInput,
  type ProjectWorkspaceRecord,
  type ReviewExtractedEntitiesInput,
} from './workspaces.service.js';
import type { CreateProjectInput } from '../projects/projects.service.js';

class WorkspaceSrsUploadDto {
  @ApiProperty({ enum: ['pdf', 'docx', 'markdown'], required: false, default: 'markdown' })
  format?: 'pdf' | 'docx' | 'markdown';

  @ApiProperty({ example: 'requirements.md' })
  fileName!: string;

  @ApiProperty({ example: 'FR-01: User can create a workspace.' })
  content!: string;
}

class WorkspaceSrsReviewDto {
  @ApiProperty({ type: [Object], required: false })
  requirements?: Array<{ id: string; description: string; constraints?: string[] }>;

  @ApiProperty({ type: [Object], required: false })
  useCases?: Array<{ title: string; actors?: string[]; preconditions?: string[]; postconditions?: string[]; mainFlow?: string[] }>;

  @ApiProperty({ type: [Object], required: false })
  classes?: Array<{ name: string; stereotype?: 'Entity' | 'Boundary' | 'Control'; fields: Array<{ name: string; type: string; visibility?: 'public' | 'private' | 'protected'; defaultValue?: string }>; methods: Array<{ name: string; returnType?: string; parameters?: string[]; visibility?: 'public' | 'private' | 'protected' }>; relationships?: string[] }>;
}

@ApiTags('workspaces')
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Get()
  @ApiOperation({ summary: 'List all specification workspaces' })
  @ApiResponse({ status: 200, description: 'Workspaces returned successfully.' })
  async listWorkspaces(): Promise<ProjectWorkspaceRecord[]> {
    return this.workspacesService.listWorkspaces();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new workspace for a specification-first workflow' })
  @ApiResponse({ status: 201, description: 'Workspace created successfully.' })
  @ApiBody({
    schema: {
      example: {
        title: 'SpecFlow',
        description: 'Architecture and implementation review workspace.',
        repositoryUrl: 'https://github.com/acme/specflow',
        defaultBranch: 'main',
        overview: 'The product captures software specifications and checks repository implementation against them.',
        goals: ['Document product intent', 'Compare implementation to the spec'],
        requirements: ['Import or draft a spec', 'Connect the Git repo', 'Share for review'],
        architecture: 'Document-first workflow with mismatch detection and review handoff.',
        acceptanceCriteria: ['A report highlights drift', 'Stakeholders can review the project'],
      },
    },
  })
  async createProjectWorkspace(@Body() body: any): Promise<ProjectWorkspaceRecord> {
    return this.workspacesService.createProjectWorkspace(body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch a workspace and all the project records attached to it' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiResponse({ status: 200, description: 'Workspace retrieved successfully.' })
  async getWorkspace(@Param('id') id: string): Promise<ProjectWorkspaceRecord> {
    return this.workspacesService.getWorkspace(id);
  }

  @Post(':id/projects')
  @ApiOperation({ summary: 'Create a project inside an existing workspace' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiResponse({ status: 201, description: 'Project created inside the workspace.' })
  async createProjectInWorkspace(@Param('id') id: string, @Body() body: CreateProjectInput) {
    return this.workspacesService.createProjectInWorkspace(id, body);
  }

  @Post(':id/srs-ingest')
  @ApiOperation({ summary: 'Upload and parse an SRS document to extract requirements, use cases, and domain classes' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiResponse({ status: 200, description: 'SRS document ingested and analyzed successfully.' })
  async ingestSrsDocument(@Param('id') id: string, @Body() body: WorkspaceSrsUploadDto) {
    return this.workspacesService.ingestSrsDocument(id, {
      format: body.format ?? 'markdown',
      fileName: body.fileName ?? 'uploaded-srs-document.md',
      content: body.content ?? '',
    } satisfies IngestSrsDocumentInput);
  }

  @Post(':id/srs-review')
  @ApiOperation({ summary: 'Review and override the SRS entities extracted from the uploaded document' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiResponse({ status: 200, description: 'Extracted SRS entities updated successfully.' })
  async reviewExtractedEntities(@Param('id') id: string, @Body() body: WorkspaceSrsReviewDto) {
    return this.workspacesService.reviewExtractedEntities(id, {
      requirements: body.requirements,
      useCases: body.useCases,
      classes: body.classes,
    } satisfies ReviewExtractedEntitiesInput);
  }

  @Post(':id/specification')
  @ApiOperation({ summary: 'Import or update the project specification' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiResponse({ status: 200, description: 'Specification imported successfully.' })
  async importSpecification(@Param('id') id: string, @Body() body: any) {
    return this.workspacesService.importSpecification(id, body);
  }

  @Post(':id/repository')
  @ApiOperation({ summary: 'Connect a Git repository to the workspace for validation' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiResponse({ status: 200, description: 'Repository connected successfully.' })
  async connectRepository(@Param('id') id: string, @Body() body: any) {
    return this.workspacesService.connectRepository(id, body);
  }

  @Post(':id/check')
  @ApiOperation({ summary: 'Compare the repository implementation against the written specification' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiResponse({ status: 200, description: 'Implementation review completed.' })
  async checkImplementation(@Param('id') id: string, @Body() body: { files?: string[]; context?: string }) {
    return this.workspacesService.checkImplementationAgainstSpec(id, body.files ?? [], body.context ?? '');
  }

  @Post(':id/review')
  @ApiOperation({ summary: 'Share the workspace for review' })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  @ApiResponse({ status: 200, description: 'Review link generated successfully.' })
  async shareProjectForReview(@Param('id') id: string, @Body('reviewer') reviewer: string) {
    return this.workspacesService.shareProjectForReview(id, reviewer ?? 'Product team');
  }
}

