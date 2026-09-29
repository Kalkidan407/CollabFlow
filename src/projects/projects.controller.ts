import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ProjectsService, type CreateProjectInput, type SubmitIdeaInput } from './projects.service.js';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a student project and initialize the discovery workflow' })
  @ApiResponse({ status: 201, description: 'Project created successfully.' })
  @ApiBody({
    schema: {
      example: {
        title: 'Smart Campus Transportation System',
        teamSize: 5,
        advisorName: 'Dr. Abebe',
        academicYear: '2026/27',
        teamMembers: ['Alem', 'Biruk', 'Chala', 'Dawit', 'Ephrem'],
        advisorEmail: 'abebe@university.edu',
      },
    },
  })
  createProject(@Body() dto: CreateProjectInput) {
    return this.projectsService.createProject(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch a project by ID and inspect team, advisor, and lifecycle status' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project details returned successfully.' })
  getProject(@Param('id') id: string) {
    return this.projectsService.getProject(id);
  }

  @Post(':id/ideas')
  @ApiOperation({ summary: 'Submit a team project idea with problem, solution, stakeholders, and target users' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 201, description: 'Idea submitted successfully.' })
  @ApiBody({
    schema: {
      example: {
        problem: 'Students struggle to find reliable transportation to campus during rush hours.',
        solution: 'A smart route-tracking platform for students and drivers.',
        stakeholders: ['Students', 'Drivers', 'Campus administration'],
        targetUsers: ['Undergraduate students', 'Campus visitors'],
        submittedBy: 'Alem',
      },
    },
  })
  submitIdea(@Param('id') id: string, @Body() dto: SubmitIdeaInput) {
    return this.projectsService.submitIdea(id, dto);
  }

  @Post(':id/ideas/:ideaId/vote')
  @ApiOperation({ summary: 'Vote for a submitted project idea during idea discovery and group selection' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiParam({ name: 'ideaId', description: 'Idea ID' })
  @ApiResponse({ status: 200, description: 'Vote submitted successfully.' })
  voteOnIdea(@Param('id') id: string, @Param('ideaId') ideaId: string, @Body('voter') voter: string) {
    return this.projectsService.voteOnIdea(id, ideaId, voter);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Allow the advisor to approve the selected project and move it into the software lifecycle' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project approved successfully.' })
  approveProject(@Param('id') id: string, @Body('advisorName') advisorName: string) {
    return this.projectsService.approveProject(id, advisorName);
  }

  @Get(':id/documentation')
  @ApiOperation({ summary: 'Generate a structured project documentation draft from the project idea and activity history' })
  @ApiParam({ name: 'id', description: 'Project ID' })
  @ApiResponse({ status: 200, description: 'Project documentation draft returned successfully.' })
  generateDocumentation(@Param('id') id: string) {
    return this.projectsService.generateDocumentation(id);
  }
}
