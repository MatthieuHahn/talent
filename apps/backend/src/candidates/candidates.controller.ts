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
import { User, JwtAuthGuard } from '../auth';
import type { AuthenticatedUser } from '../auth';
import {
  CreateCandidateDto,
  CreateCandidateFromResumeDto,
  UpdateCandidateDto,
  CandidateQueryDto,
  MatchCandidatesDto,
} from './dto/candidate.dto';

@Controller('candidates')
@UseGuards(JwtAuthGuard)
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Post('upload-resume')
  @UseInterceptors(FileInterceptor('resume'))
  async createFromResume(
    @UploadedFile() file: Express.Multer.File,
    @Body() additionalData: CreateCandidateFromResumeDto,
    @User() user: AuthenticatedUser,
  ) {
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
  ) {
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
  async findAll(@Query() query: CandidateQueryDto, @User() user: AuthenticatedUser) {
    // Get organization and user from JWT token
    const organizationId = user.organizationId;

    return this.candidatesService.findAll(organizationId, query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @User() user: AuthenticatedUser) {
    // Get organization and user from JWT token
    const organizationId = user.organizationId;

    return this.candidatesService.findOne(id, organizationId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCandidateDto: UpdateCandidateDto,
    @User() user: AuthenticatedUser,
  ) {
    // Get organization and user from JWT token
    const organizationId = user.organizationId;

    return this.candidatesService.update(
      id,
      organizationId,
      updateCandidateDto,
    );
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @User() user: AuthenticatedUser) {
    // Get organization and user from JWT token
    const organizationId = user.organizationId;

    return this.candidatesService.remove(id, organizationId);
  }

  @Post('match-to-job')
  async matchToJob(@Body() matchData: MatchCandidatesDto, @User() user: AuthenticatedUser) {
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
  ) {
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
