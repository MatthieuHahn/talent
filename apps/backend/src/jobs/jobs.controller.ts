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
import { S3Service } from '../s3/s3.service';
import { User, JwtAuthGuard } from '../auth';
import type { AuthenticatedUser } from '../auth';
import { Job, Organization, User as UserType } from '@talent/types';
import {
  CreateJobDto,
  CreateJobWithAIDto,
  CreateJobFromFileDto,
  UpdateJobDto,
  JobQueryDto,
} from './dto/job.dto';

// Type definitions for API responses
type JobWithListRelations = Job & {
  company: { id: string; name: string };
  recruiter: { id: string; firstName: string; lastName: string; email: string };
  applications: { id: string; status: any }[];
  _count: { applications: number };
};

type JobWithDetailRelations = Job & {
  organization: Organization;
  company: any;
  recruiter: { id: string; firstName: string; lastName: string; email: string };
  applications: Array<{
    id: string;
    status: any;
    candidate: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      status: any;
    };
  }>;
};

type JobWithCreateRelations = Job & {
  organization: Organization;
  company: any;
  recruiter: { id: string; firstName: string; lastName: string; email: string };
  applications: any[];
};

type JobsListResponse = {
  jobs: JobWithListRelations[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

type JobStatsResponse = {
  totalJobs: number;
  activeJobs: number;
  draftJobs: number;
  filledJobs: number;
  totalApplications: number;
};

@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly s3Service: S3Service,
  ) {}

  @Get(':id/job-description-url')
  async getJobDescriptionUrl(
    @Param('id') id: string,
    @User() user: AuthenticatedUser,
  ): Promise<{ url: string }> {
    const organizationId = user.organizationId;
    const job = await this.jobsService.findOne(id, organizationId);
    if (!job || !job.jobDescriptionUrl) {
      throw new BadRequestException('Job description not found');
    }
    // Extract bucket and key from the jobDescriptionUrl
    // Example: http://localhost:9000/job-descriptions/orgid/jobs/file.pdf
    const urlParts = job.jobDescriptionUrl.split('/');
    const bucket = urlParts[3];
    const key = urlParts.slice(4).join('/');
    // Generate signed URL (valid for 5 minutes)
    const signedUrl = await this.s3Service.getSignedUrl({
      bucket,
      key,
      expiresIn: 300,
    });
    return { url: signedUrl };
  }

  @Post()
  async create(
    @Body() createJobDto: CreateJobDto,
    @User() user: AuthenticatedUser,
  ): Promise<JobWithCreateRelations> {
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
  ): Promise<JobWithCreateRelations> {
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
  ): Promise<JobWithCreateRelations> {
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
  async findAll(
    @Query() query: JobQueryDto,
    @User() user: AuthenticatedUser,
  ): Promise<JobsListResponse> {
    // Get organization from JWT token
    const organizationId = user.organizationId;

    return this.jobsService.findAll(organizationId, query);
  }

  @Get('stats')
  async getStats(@User() user: AuthenticatedUser): Promise<JobStatsResponse> {
    // Get organization from JWT token
    const organizationId = user.organizationId;

    return this.jobsService.getJobStats(organizationId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @User() user: AuthenticatedUser,
  ): Promise<JobWithDetailRelations> {
    // Get organization from JWT token
    const organizationId = user.organizationId;

    return this.jobsService.findOne(id, organizationId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateJobDto: UpdateJobDto,
    @User() user: AuthenticatedUser,
  ): Promise<JobWithCreateRelations> {
    // Get organization from JWT token
    const organizationId = user.organizationId;

    return this.jobsService.update(id, organizationId, updateJobDto);
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @User() user: AuthenticatedUser,
  ): Promise<void> {
    // Get organization from JWT token
    const organizationId = user.organizationId;

    return this.jobsService.remove(id, organizationId);
  }
}
