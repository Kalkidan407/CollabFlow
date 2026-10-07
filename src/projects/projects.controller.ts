import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProjectsService, type CreateProjectInput, type SubmitIdeaInput } from './projects.service.js';

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

  @Post(':id/import')
  @ApiOperation({ summary: 'Import an existing specification into the project.' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Specification imported successfully.' })
  importSpecification(@Param('id') id: string, @Body() dto: Record<string, any>) {
    return this.projectsService.importSpecification(id, dto);
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

  @Post(':id/review')
  @ApiOperation({ summary: 'Create a shareable review link for stakeholders to inspect the project specification.' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Review link generated.' })
  shareProjectForReview(@Param('id') id: string, @Body('reviewer') reviewer: string) {
    return this.projectsService.shareProjectForReview(id, { reviewer: reviewer ?? 'Product team' });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch a project by ID and inspect its specification, repo connection, and review status.' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project details returned successfully.' })
  getProject(@Param('id') id: string) {
    return this.projectsService.getProject(id);
  }

  @Post(':id/ideas')
  @ApiOperation({ summary: 'Submit a specification idea or backlog concept for review.' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 201, description: 'Idea submitted successfully.' })
  @ApiBody({
    schema: {
      example: {
        problem: 'Teams lose alignment when specifications drift from implementation.',
        solution: 'A repo-aware specification checker that points to missing architecture decisions.',
        stakeholders: ['Engineering', 'Product', 'Architecture'],
        targetUsers: ['Software teams', 'Engineering leads'],
        submittedBy: 'Alem',
      },
    },
  })
  submitIdea(@Param('id') id: string, @Body() dto: SubmitIdeaInput) {
    return this.projectsService.submitIdea(id, dto);
  }

  @Post(':id/ideas/:ideaId/vote')
  @ApiOperation({ summary: 'Vote for an alternative specification direction.' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiParam({ name: 'ideaId', description: 'Idea ID' })
  @ApiResponse({ status: 200, description: 'Vote submitted successfully.' })
  voteOnIdea(@Param('id') id: string, @Param('ideaId') ideaId: string, @Body('voter') voter: string) {
    return this.projectsService.voteOnIdea(id, ideaId, voter);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve the project specification and mark it ready for implementation review.' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project approved successfully.' })
  approveProject(@Param('id') id: string, @Body('advisorName') advisorName: string) {
    return this.projectsService.approveProject(id, advisorName);
  }

  @Get(':id/documentation')
  @ApiOperation({ summary: 'Generate a structured specification draft from the project description and written requirements.' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project documentation draft returned successfully.' })
  generateDocumentation(@Param('id') id: string) {
    return this.projectsService.generateDocumentation(id);
  }
}
