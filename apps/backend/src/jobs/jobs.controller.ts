import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JobsService } from './jobs.service';
import { User, JwtAuthGuard } from '../auth';
import type { AuthenticatedUser } from '../auth';
import {
  CreateJobDto,
  CreateJobWithAIDto,
  CreateJobFromFileDto,
  UpdateJobDto,
  JobQueryDto,
} from './dto/job.dto';

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  async create(
    @Body() createJobDto: CreateJobDto,
    @User() user: AuthenticatedUser,
  ) {
    // Get organization and user from JWT token
    const organizationId = user.organizationId;
    const recruiterId = user.id;

    return this.jobsService.createJob(
      createJobDto,
      organizationId,
      recruiterId,
    );
  }

  @Post('upload-job-description')
  @UseInterceptors(FileInterceptor('jobDescription'))
  async createFromFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() additionalData: CreateJobFromFileDto,
    @User() user: AuthenticatedUser,
  ) {
    if (!file) {
      throw new BadRequestException('Job description file is required');
    }

    // Get organization and user from JWT token
    const organizationId = user.organizationId;
    const recruiterId = user.id;

    return this.jobsService.createJobFromFile(
      file,
      organizationId,
      recruiterId,
      additionalData,
    );
  }

  @Post('create-with-ai')
  async createWithAI(
    @Body() createJobWithAIDto: CreateJobWithAIDto,
    @User() user: AuthenticatedUser,
  ) {
    // Get organization and user from JWT token
    const organizationId = user.organizationId;
    const recruiterId = user.id;

    return this.jobsService.createJobWithAI(
      createJobWithAIDto,
      organizationId,
      recruiterId,
    );
  }

  @Get()
  async findAll(@Query() query: JobQueryDto, @User() user: AuthenticatedUser) {
    // Get organization from JWT token
    const organizationId = user.organizationId;

    return this.jobsService.findAll(organizationId, query);
  }

  @Get('stats')
  async getStats(@User() user: AuthenticatedUser) {
    // Get organization from JWT token
    const organizationId = user.organizationId;

    return this.jobsService.getJobStats(organizationId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @User() user: AuthenticatedUser) {
    // Get organization from JWT token
    const organizationId = user.organizationId;

    return this.jobsService.findOne(id, organizationId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateJobDto: UpdateJobDto,
    @User() user: AuthenticatedUser,
  ) {
    // Get organization from JWT token
    const organizationId = user.organizationId;

    return this.jobsService.update(id, organizationId, updateJobDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @User() user: AuthenticatedUser) {
    // Get organization from JWT token
    const organizationId = user.organizationId;

    return this.jobsService.remove(id, organizationId);
  }
}
