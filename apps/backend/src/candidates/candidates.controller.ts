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
import { CandidatesService } from './candidates.service';
import { S3Service } from '../s3/s3.service';
import { User, JwtAuthGuard } from '../auth';
import type { AuthenticatedUser } from '../auth';
import {
  Candidate,
  Organization,
  JobApplication,
  MatchingResult,
  Job,
} from '@talent/types';
import {
  CreateCandidateDto,
  CreateCandidateFromResumeDto,
  UpdateCandidateDto,
  CandidateQueryDto,
  MatchCandidatesDto,
} from './dto/candidate.dto';

// Type definitions for API responses
type CandidateWithRelations = Candidate & {
  organization: Organization;
  applications: JobApplication[];
};

type CandidateWithMatching = CandidateWithRelations & {
  matchingResults: (MatchingResult & { job: Job })[];
};

type CandidatesListResponse = {
  candidates: (CandidateWithRelations & {
    matchedJobsCount: number;
    appliedJobsCount: number;
  })[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type CandidateMatchResult = {
  candidate: Candidate;
  matchScore: number;
  matchDetails: any;
};

type CandidateMatchScoreResponse =
  | CandidateMatchResult
  | {
      candidate: CandidateWithMatching;
      matchScore: number;
      matchDetails: { error: string };
    };

@Controller('candidates')
@UseGuards(JwtAuthGuard)
export class CandidatesController {
  constructor(
    private readonly candidatesService: CandidatesService,
    private readonly s3Service: S3Service,
  ) {}

  @Get(':id/resume-url')
  async getResumeUrl(
    @Param('id') id: string,
    @User() user: AuthenticatedUser,
  ): Promise<{ url: string }> {
    const organizationId = user.organizationId;
    const candidate = await this.candidatesService.findOne(id, organizationId);
    if (!candidate || !candidate.resumeUrl) {
      throw new BadRequestException('Resume not found');
    }
    // Extract bucket and key from the resumeUrl
    // Example: http://localhost:9000/resumes/orgid/candidates/file.pdf
    const urlParts = candidate.resumeUrl.split('/');
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

  @Post('upload-resume')
  @UseInterceptors(FileInterceptor('resume'))
  async createFromResume(
    @UploadedFile() file: Express.Multer.File,
    @Body() additionalData: CreateCandidateFromResumeDto,
    @User() user: AuthenticatedUser,
  ): Promise<CandidateWithRelations> {
    if (!file) {
      throw new BadRequestException('Resume file is required');
    }

    // Get organization and user from JWT token
    const organizationId = user.organizationId;
    const userId = user.id;

    return this.candidatesService.createCandidateFromResume(
      file,
      organizationId,
      userId,
      additionalData,
    );
  }

  @Post()
  async create(
    @Body() createCandidateDto: CreateCandidateDto,
    @User() user: AuthenticatedUser,
  ): Promise<CandidateWithRelations> {
    // Get organization and user from JWT token
    const organizationId = user.organizationId;
    const userId = user.id;

    return this.candidatesService.create(
      createCandidateDto,
      organizationId,
      userId,
    );
  }

  @Get()
  async findAll(
    @Query() query: CandidateQueryDto,
    @User() user: AuthenticatedUser,
  ): Promise<CandidatesListResponse> {
    // Get organization and user from JWT token
    const organizationId = user.organizationId;

    return this.candidatesService.findAll(organizationId, query);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @User() user: AuthenticatedUser,
  ): Promise<CandidateWithMatching> {
    // Get organization and user from JWT token
    const organizationId = user.organizationId;

    return this.candidatesService.findOne(id, organizationId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCandidateDto: UpdateCandidateDto,
    @User() user: AuthenticatedUser,
  ): Promise<CandidateWithRelations> {
    // Get organization and user from JWT token
    const organizationId = user.organizationId;

    return this.candidatesService.update(
      id,
      organizationId,
      updateCandidateDto,
    );
  }

  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @User() user: AuthenticatedUser,
  ): Promise<Candidate> {
    // Get organization and user from JWT token
    const organizationId = user.organizationId;

    return this.candidatesService.remove(id, organizationId);
  }

  @Post('match-to-job')
  async matchToJob(
    @Body() matchData: MatchCandidatesDto,
    @User() user: AuthenticatedUser,
  ): Promise<CandidateMatchResult[]> {
    // Get organization and user from JWT token
    const organizationId = user.organizationId;

    return this.candidatesService.matchCandidatesToJob(
      organizationId,
      matchData,
    );
  }

  @Get(':id/match-score/:jobId')
  async getMatchScore(
    @Param('id') candidateId: string,
    @Param('jobId') jobId: string,
    @User() user: AuthenticatedUser,
  ): Promise<CandidateMatchScoreResponse> {
    // Get organization and user from JWT token
    const organizationId = user.organizationId;

    // Get candidate and job
    const candidate = await this.candidatesService.findOne(
      candidateId,
      organizationId,
    );

    // Use the matching service with single candidate
    const matches = await this.candidatesService.matchCandidatesToJob(
      organizationId,
      { jobId, limit: 1, minMatchScore: 0 },
    );

    const match = matches.find((m) => m.candidate.id === candidateId);

    if (!match) {
      return {
        candidate,
        matchScore: 0,
        matchDetails: {
          error: 'Unable to calculate match score',
        },
      };
    }

    return match;
  }
}
