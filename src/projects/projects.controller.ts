import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProjectsService, type CreateProjectInput, type SubmitIdeaInput } from './projects.service.js';

class UploadSrsDocumentDto {
  @ApiProperty({ enum: ['pdf', 'docx', 'markdown'], required: false, default: 'markdown' })
  format?: 'pdf' | 'docx' | 'markdown';

  @ApiProperty({ example: 'requirements.md' })
  fileName!: string;

  @ApiProperty({ example: 'FR-01: User can create a workspace.' })
  content!: string;
}

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a specification-first project and optionally attach a repository URL.' })
  @ApiResponse({ status: 201, description: 'Project created successfully.' })
  @ApiBody({
    schema: {
      example: {
        title: 'SpecGuard',
        description: 'Architecture and specification linter for engineering teams.',
        repositoryUrl: 'https://github.com/acme/specguard',
        defaultBranch: 'main',
        source: 'draft',
        specification: {
          overview: 'Teams need a clear specification and a repo-level validation layer.',
          goals: ['Capture product intent', 'Compare repo implementation to product requirements'],
          nonGoals: ['Track sprint tasks'],
          requirements: ['Import or draft a specification', 'Connect a repo for validation'],
          architecture: 'Document-first review layer plus implementation mismatch checks.',
          acceptanceCriteria: ['A review report is generated', 'Missing architecture details are highlighted'],
        },
      },
    },
  })
  createProject(@Body() dto: CreateProjectInput) {
    return this.projectsService.createProject(dto);
  }

  @Post(':id/srs')
  @ApiOperation({ summary: 'Upload an SRS document, extract the key requirements and classes, and attach the extracted specification to the project.' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'SRS document ingested and extracted successfully.' })
  ingestSrsDocument(
    @Param('id') id: string,
    @Body() dto: UploadSrsDocumentDto
  ) {
    return this.projectsService.ingestSrsDocument(id, {
      format: dto.format ?? 'markdown',
      fileName: dto.fileName ?? 'uploaded-srs-document.md',
      content: dto.content ?? '',
    });
  }

  @Post(':id/repository')
  @ApiOperation({ summary: 'Attach a Git repository to the project so implementation can be checked against the spec.' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Repository connected successfully.' })
  connectRepository(@Param('id') id: string, @Body() dto: { provider?: string; url: string; defaultBranch?: string; files?: string[] }) {
    return this.projectsService.connectRepository(id, dto);
  }

  @Post(':id/check')
  @ApiOperation({ summary: 'Compare the checked-in repository implementation with the specification.' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Specification review completed.' })
  checkImplementation(@Param('id') id: string, @Body() dto: { files?: string[]; context?: string }) {
    return this.projectsService.checkImplementationAgainstSpec(id, dto.files ?? [], dto.context ?? '');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch a project by ID and inspect its specification, repo connection, and review status.' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project details returned successfully.' })
  getProject(@Param('id') id: string) {
    return this.projectsService.getProject(id);
  }

}
