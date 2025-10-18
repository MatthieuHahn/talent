import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenAiService } from '../openai/openai.service';
import { FileParsingService } from '../file-parsing/file-parsing.service';
import { S3Service } from '../s3/s3.service';
import {
  CreateJobDto,
  CreateJobWithAIDto,
  CreateJobFromFileDto,
  UpdateJobDto,
  JobQueryDto,
} from './dto/job.dto';
import { JobStatus, JobType, JobLevel, Priority } from '@prisma/client';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly openAiService: OpenAiService,
    private readonly fileParsingService: FileParsingService,
    private readonly s3Service: S3Service,
  ) {}

  private async ensureDefaultUserAndOrg(): Promise<{
    userId: string;
    organizationId: string;
    companyId: string;
  }> {
    // Check if default organization exists
    let organization = await this.prisma.organization.findFirst({
      where: { name: 'Default Organization' },
    });

    if (!organization) {
      organization = await this.prisma.organization.create({
        data: {
          name: 'Default Organization',
          slug: 'default',
          plan: 'STARTER',
          contactEmail: 'admin@default.com',
        },
      });
    }

    // Check if default user exists
    let user = await this.prisma.user.findFirst({
      where: { email: 'admin@default.com' },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: 'admin@default.com',
          firstName: 'Default',
          lastName: 'Admin',
          role: 'ADMIN',
          organizationId: organization.id,
          password: 'dummy-hash',
        },
      });
    }

    // Check if default company exists
    let company = await this.prisma.company.findFirst({
      where: { organizationId: organization.id },
    });

    if (!company) {
      company = await this.prisma.company.create({
        data: {
          name: 'Default Company',
          organizationId: organization.id,
        },
      });
    }

    return {
      userId: user.id,
      organizationId: organization.id,
      companyId: company.id,
    };
  }

  async createJob(
    createJobDto: CreateJobDto,
    organizationId: string,
    recruiterId: string,
  ): Promise<any> {
    try {
      // Ensure we have valid IDs
      const {
        userId: validUserId,
        organizationId: validOrgId,
        companyId: validCompanyId,
      } = await this.ensureDefaultUserAndOrg();

      const actualOrgId =
        organizationId === 'dummy-org-id' ? validOrgId : organizationId;
      const actualRecruiterId =
        recruiterId === 'dummy-user-id' ? validUserId : recruiterId;
      const actualCompanyId = createJobDto.companyId || validCompanyId;

      const jobData = {
        ...createJobDto,
        remote: this.convertToBoolean(createJobDto.remote) ?? false,
        salaryMin: this.convertToNumber(createJobDto.salaryMin),
        salaryMax: this.convertToNumber(createJobDto.salaryMax),
        organizationId: actualOrgId,
        recruiterId: actualRecruiterId,
        companyId: actualCompanyId,
        startDate: createJobDto.startDate
          ? new Date(createJobDto.startDate)
          : undefined,
        endDate: createJobDto.endDate
          ? new Date(createJobDto.endDate)
          : undefined,
        deadline: createJobDto.deadline
          ? new Date(createJobDto.deadline)
          : undefined,
      };

      const job = await this.prisma.job.create({
        data: jobData,
        include: {
          organization: true,
          company: true,
          recruiter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          applications: true,
        },
      });

      // Generate embedding for semantic matching
      try {
        const embedding = await this.openAiService.generateJobEmbedding(job);
        await this.prisma.job.update({
          where: { id: job.id },
          data: {
            embedding: JSON.stringify(embedding),
            embeddingModel: 'text-embedding-3-small',
            embeddingAt: new Date(),
          },
        });
        this.logger.log(`Generated embedding for job ${job.id}`);
      } catch (embeddingError) {
        this.logger.warn(
          `Failed to generate embedding for job ${job.id}:`,
          embeddingError,
        );
        // Don't fail the entire operation if embedding generation fails
      }

      this.logger.log(`Job created successfully: ${job.id}`);
      return job;
    } catch (error) {
      this.logger.error('Error creating job:', error);
      throw error;
    }
  }

  async createJobWithAI(
    createJobWithAIDto: CreateJobWithAIDto,
    organizationId: string,
    recruiterId: string,
  ): Promise<any> {
    try {
      this.logger.log('Creating job with AI-generated description...');

      // Generate AI description
      const aiDescription = await this.openAiService.generateJobDescription(
        createJobWithAIDto.title,
        createJobWithAIDto.company,
        createJobWithAIDto.requirements,
        createJobWithAIDto.benefits,
      );

      // Create job with AI-generated description
      const createJobDto: CreateJobDto = {
        ...createJobWithAIDto,
        description: aiDescription,
        requirements: createJobWithAIDto.requirements.join('\n'),
      };

      const job = await this.createJob(
        createJobDto,
        organizationId,
        recruiterId,
      );

      // Mark as AI-generated and store the original prompt
      const updatedJob = await this.prisma.job.update({
        where: { id: job.id },
        data: {
          aiGenerated: true,
          aiPrompt: JSON.stringify({
            title: createJobWithAIDto.title,
            company: createJobWithAIDto.company,
            requirements: createJobWithAIDto.requirements,
            benefits: createJobWithAIDto.benefits,
          }),
        },
        include: {
          organization: true,
          company: true,
          recruiter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          applications: true,
        },
      });

      this.logger.log(
        `AI-generated job created successfully: ${updatedJob.id}`,
      );
      return updatedJob;
    } catch (error) {
      this.logger.error('Error creating job with AI:', error);
      throw error;
    }
  }

  async createJobFromFile(
    file: Express.Multer.File,
    organizationId: string,
    recruiterId: string,
    additionalData?: CreateJobFromFileDto,
  ): Promise<any> {
    try {
      this.logger.log('Creating job from uploaded file...');

      // Ensure we have valid user and organization IDs
      const { userId: validUserId, organizationId: validOrgId } =
        await this.ensureDefaultUserAndOrg();

      // Use the valid IDs instead of dummy ones
      const actualOrgId =
        organizationId === 'dummy-org-id' ? validOrgId : organizationId;
      const actualRecruiterId =
        recruiterId === 'dummy-user-id' ? validUserId : recruiterId;

      // Validate file
      this.fileParsingService.validateFileSize(file, 10);

      // Upload job description file to S3
      const jobDescBucket =
        process.env.S3_JOB_DESCRIPTION_BUCKET || 'job-descriptions';
      const jobDescKey = `${actualOrgId}/jobs/${Date.now()}_${file.originalname}`;
      const jobDescriptionUrl = await this.s3Service.uploadFile({
        bucket: jobDescBucket,
        key: jobDescKey,
        body: file.buffer,
        contentType: file.mimetype,
      });

      // Parse the job description file
      const jobText = await this.fileParsingService.parseResumeFile(file);

      // Use OpenAI to parse the job description
      const parsedData = await this.openAiService.parseJobDescription(jobText);
      // Map parsed data to job creation format
      const jobData = this.mapParsedJobDataToCreateJobDto(
        parsedData,
        additionalData,
      );

      // Add jobDescriptionUrl to jobData
      jobData.jobDescriptionUrl = jobDescriptionUrl;

      // Create the job
      const job = await this.createJob(jobData, actualOrgId, actualRecruiterId);

      // Mark as AI-parsed and store the parsed data
      const updatedJob = await this.prisma.job.update({
        where: { id: job.id },
        data: {
          aiGenerated: true,
          aiPrompt: JSON.stringify({
            source: 'file_upload',
            fileName: file.originalname,
            parsedData: parsedData,
          }),
        },
        include: {
          organization: true,
          company: true,
          recruiter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          applications: true,
        },
      });

      this.logger.log(`Job created from file successfully: ${updatedJob.id}`);
      return updatedJob;
    } catch (error) {
      this.logger.error('Error creating job from file:', error);
      throw error;
    }
  }

  private mapParsedJobDataToCreateJobDto(
    parsedData: any,
    additionalData?: CreateJobFromFileDto,
  ): CreateJobDto {
    // Map job type string to enum
    const mapJobType = (type: string): JobType => {
      const upperType = type?.toUpperCase();
      switch (upperType) {
        case 'FULL_TIME':
          return JobType.FULL_TIME;
        case 'PART_TIME':
          return JobType.PART_TIME;
        case 'CONTRACT':
          return JobType.CONTRACT;
        case 'FREELANCE':
          return JobType.FREELANCE;
        case 'INTERNSHIP':
          return JobType.INTERNSHIP;
        default:
          return additionalData?.type || JobType.FULL_TIME;
      }
    };

    // Map job level string to enum
    const mapJobLevel = (level: string): JobLevel => {
      const upperLevel = level?.toUpperCase();
      switch (upperLevel) {
        case 'ENTRY':
          return JobLevel.ENTRY;
        case 'JUNIOR':
          return JobLevel.JUNIOR;
        case 'MID':
          return JobLevel.MID;
        case 'SENIOR':
          return JobLevel.SENIOR;
        case 'LEAD':
          return JobLevel.LEAD;
        case 'PRINCIPAL':
          return JobLevel.PRINCIPAL;
        case 'EXECUTIVE':
          return JobLevel.EXECUTIVE;
        default:
          return additionalData?.level || JobLevel.MID;
      }
    };

    // Map urgency to priority
    const mapPriority = (urgency: string): Priority => {
      const upperUrgency = urgency?.toUpperCase();
      switch (upperUrgency) {
        case 'LOW':
          return Priority.LOW;
        case 'MEDIUM':
          return Priority.MEDIUM;
        case 'HIGH':
          return Priority.HIGH;
        case 'URGENT':
          return Priority.URGENT;
        default:
          return additionalData?.priority || Priority.MEDIUM;
      }
    };

    return {
      title: parsedData.jobInfo?.title || 'Untitled Position',
      description: parsedData.description || '',
      requirements: [
        ...(parsedData.requirements?.mandatory || []),
        ...(parsedData.requirements?.preferred || []),
      ].join('\n'),
      department: additionalData?.department || parsedData.jobInfo?.department,
      location: additionalData?.location || parsedData.jobInfo?.location,
      remote:
        this.convertToBoolean(additionalData?.remote) ??
        parsedData.jobInfo?.remote ??
        false,
      type: mapJobType(parsedData.jobInfo?.type),
      level: mapJobLevel(parsedData.jobInfo?.level),
      salaryMin:
        this.convertToNumber(additionalData?.salaryMin) ||
        parsedData.benefits?.salary?.min,
      salaryMax:
        this.convertToNumber(additionalData?.salaryMax) ||
        parsedData.benefits?.salary?.max,
      currency:
        additionalData?.currency ||
        parsedData.benefits?.salary?.currency ||
        'USD',
      status: JobStatus.DRAFT,
      priority: mapPriority(parsedData.metadata?.urgency),
      startDate: parsedData.metadata?.startDate,
      deadline:
        additionalData?.deadline || parsedData.applicationInfo?.deadline,
      // Store complete structured data from OpenAI parsing - matches the prompt structure exactly
      jobInfo: parsedData.jobInfo || null,
      requirementsDetailed: parsedData.requirements || null,
      responsibilities: parsedData.responsibilities || null,
      benefits: parsedData.benefits || null,
      applicationInfo: parsedData.applicationInfo || null,
      metadata: parsedData.metadata || null,
    };
  }

  private convertToBoolean(value: any): boolean | undefined {
    if (value === undefined || value === null) {
      return undefined;
    }
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      if (lowerValue === 'true') return true;
      if (lowerValue === 'false') return false;
    }
    // For numbers: 0 = false, anything else = true
    if (typeof value === 'number') {
      return value !== 0;
    }
    return undefined;
  }

  private convertToNumber(value: any): number | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
  }

  async findAll(organizationId: string, query?: JobQueryDto): Promise<any> {
    try {
      // Ensure we have valid organization ID
      const { organizationId: validOrgId } =
        await this.ensureDefaultUserAndOrg();
      const actualOrgId =
        organizationId === 'dummy-org-id' ? validOrgId : organizationId;

      const page = Number(query?.page) || 1;
      const limit = Number(query?.limit) || 10;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {
        organizationId: actualOrgId,
      };

      if (query?.search) {
        where.OR = [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          { requirements: { contains: query.search, mode: 'insensitive' } },
          { department: { contains: query.search, mode: 'insensitive' } },
          { location: { contains: query.search, mode: 'insensitive' } },
        ];
      }

      if (query?.status) where.status = query.status;
      if (query?.type) where.type = query.type;
      if (query?.level) where.level = query.level;
      if (query?.priority) where.priority = query.priority;
      if (query?.department) where.department = query.department;
      if (query?.location)
        where.location = { contains: query.location, mode: 'insensitive' };
      if (query?.remote !== undefined) where.remote = query.remote;

      // Build orderBy
      const orderBy: any = {};
      if (query?.sortBy) {
        orderBy[query.sortBy] = query.sortOrder || 'desc';
      } else {
        orderBy.createdAt = 'desc';
      }

      const [jobs, total] = await Promise.all([
        this.prisma.job.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            company: {
              select: {
                id: true,
                name: true,
              },
            },
            recruiter: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            applications: {
              select: {
                id: true,
                status: true,
              },
            },
            _count: {
              select: {
                applications: true,
              },
            },
          },
        }),
        this.prisma.job.count({ where }),
      ]);

      return {
        jobs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      this.logger.error('Error fetching jobs:', error);
      throw error;
    }
  }

  async findOne(id: string, organizationId: string): Promise<any> {
    try {
      // Ensure we have valid organization ID
      const { organizationId: validOrgId } =
        await this.ensureDefaultUserAndOrg();
      const actualOrgId =
        organizationId === 'dummy-org-id' ? validOrgId : organizationId;

      const job = await this.prisma.job.findFirst({
        where: {
          id,
          organizationId: actualOrgId,
        },
        include: {
          organization: true,
          company: true,
          recruiter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          applications: {
            include: {
              candidate: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  status: true,
                },
              },
            },
          },
        },
      });

      if (!job) {
        throw new NotFoundException(`Job with ID ${id} not found`);
      }

      return job;
    } catch (error) {
      this.logger.error(`Error fetching job ${id}:`, error);
      throw error;
    }
  }

  async update(
    id: string,
    organizationId: string,
    updateJobDto: UpdateJobDto,
  ): Promise<any> {
    try {
      // Ensure we have valid organization ID
      const { organizationId: validOrgId } =
        await this.ensureDefaultUserAndOrg();
      const actualOrgId =
        organizationId === 'dummy-org-id' ? validOrgId : organizationId;

      // Check if job exists
      const existingJob = await this.prisma.job.findFirst({
        where: {
          id,
          organizationId: actualOrgId,
        },
      });

      if (!existingJob) {
        throw new NotFoundException(`Job with ID ${id} not found`);
      }

      const updateData = {
        ...updateJobDto,
        remote:
          updateJobDto.remote !== undefined
            ? this.convertToBoolean(updateJobDto.remote)
            : undefined,
        salaryMin:
          updateJobDto.salaryMin !== undefined
            ? this.convertToNumber(updateJobDto.salaryMin)
            : undefined,
        salaryMax:
          updateJobDto.salaryMax !== undefined
            ? this.convertToNumber(updateJobDto.salaryMax)
            : undefined,
        startDate: updateJobDto.startDate
          ? new Date(updateJobDto.startDate)
          : undefined,
        endDate: updateJobDto.endDate
          ? new Date(updateJobDto.endDate)
          : undefined,
        deadline: updateJobDto.deadline
          ? new Date(updateJobDto.deadline)
          : undefined,
      };

      const updatedJob = await this.prisma.job.update({
        where: { id },
        data: updateData,
        include: {
          organization: true,
          company: true,
          recruiter: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          applications: true,
        },
      });

      this.logger.log(`Job updated successfully: ${id}`);
      return updatedJob;
    } catch (error) {
      this.logger.error(`Error updating job ${id}:`, error);
      throw error;
    }
  }

  async remove(id: string, organizationId: string): Promise<void> {
    try {
      // Ensure we have valid organization ID
      const { organizationId: validOrgId } =
        await this.ensureDefaultUserAndOrg();
      const actualOrgId =
        organizationId === 'dummy-org-id' ? validOrgId : organizationId;

      const job = await this.prisma.job.findFirst({
        where: {
          id,
          organizationId: actualOrgId,
        },
      });

      if (!job) {
        throw new NotFoundException(`Job with ID ${id} not found`);
      }

      await this.prisma.job.delete({
        where: { id },
      });

      this.logger.log(`Job deleted successfully: ${id}`);
    } catch (error) {
      this.logger.error(`Error deleting job ${id}:`, error);
      throw error;
    }
  }

  async getJobStats(organizationId: string): Promise<any> {
    try {
      // Ensure we have valid organization ID
      const { organizationId: validOrgId } =
        await this.ensureDefaultUserAndOrg();
      const actualOrgId =
        organizationId === 'dummy-org-id' ? validOrgId : organizationId;

      const [totalJobs, activeJobs, draftJobs, filledJobs, totalApplications] =
        await Promise.all([
          this.prisma.job.count({
            where: { organizationId: actualOrgId },
          }),
          this.prisma.job.count({
            where: { organizationId: actualOrgId, status: JobStatus.ACTIVE },
          }),
          this.prisma.job.count({
            where: { organizationId: actualOrgId, status: JobStatus.DRAFT },
          }),
          this.prisma.job.count({
            where: { organizationId: actualOrgId, status: JobStatus.CLOSED },
          }),
          this.prisma.jobApplication.count({
            where: {
              job: { organizationId: actualOrgId },
            },
          }),
        ]);

      return {
        totalJobs,
        activeJobs,
        draftJobs,
        filledJobs,
        totalApplications,
      };
    } catch (error) {
      this.logger.error('Error fetching job stats:', error);
      throw error;
    }
  }
}
