import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { MatchingService } from './matching.service';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { User } from '../auth/decorators/user.decorator';
import { JobApplication } from '@talent/types';

@Controller('matching')
@UseGuards(JwtAuthGuard)
export class MatchingController {
  constructor(private readonly matchingService: MatchingService) {}

  /**
   * Update the status of a candidate for a specific job
   */

  @Patch('job/:jobId/candidate/:candidateId/status')
  async updateCandidateStatusForJob(
    @Param('jobId') jobId: string,
    @Param('candidateId') candidateId: string,
    @User() user: any,
    @Body('status') status: string,
  ): Promise<JobApplication> {
    if (!status) {
      throw new BadRequestException('Status is required');
    }
    return this.matchingService.updateCandidateStatusForJob(
      jobId,
      candidateId,
      status,
      user.organizationId,
    );
  }

  /**
   * Find best candidates for a specific job using AI matching
   */
  @Get('job/:jobId/candidates')
  async findBestCandidatesForJob(
    @Param('jobId') jobId: string,
    @User() user: any,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number = 5,
    @Query('forceRematch', new DefaultValuePipe(false))
    forceRematch: boolean = false,
  ): Promise<any[]> {
    return this.matchingService.findBestCandidatesForJob(
      jobId,
      user.organizationId,
      limit,
      forceRematch,
    );
  }

  /**
   * Find similar candidates based on embeddings and skills
   */
  @Get('candidate/:candidateId/similar')
  async findSimilarCandidates(
    @Param('candidateId') candidateId: string,
    @User() user: any,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number = 5,
  ): Promise<any[]> {
    return this.matchingService.findSimilarCandidates(
      candidateId,
      user.organizationId,
      limit,
    );
  }

  /**
   * Get detailed AI analysis of a specific job-candidate match
   */
  @Get('job/:jobId/candidate/:candidateId/analysis')
  async analyzeJobCandidateMatch(
    @Param('jobId') jobId: string,
    @Param('candidateId') candidateId: string,
    @User() user: any,
  ): Promise<{
    aiAnalysis: any;
    skillMatches: any;
    score: number | null;
    embeddingSimilarity: number | null;
    fromCache: boolean;
  }> {
    // First check for cached results
    const cachedResult =
      await this.matchingService.getCachedSingleMatchingResult(
        jobId,
        candidateId,
        user.organizationId,
      );

    if (cachedResult) {
      console.log(
        `[MatchingController] Using cached analysis for job ${jobId} and candidate ${candidateId}`,
      );
      // Return the full matching result which includes both aiAnalysis and skillMatches
      return {
        aiAnalysis: cachedResult.aiAnalysis,
        skillMatches: cachedResult.skillMatches,
        score: cachedResult.score,
        embeddingSimilarity: cachedResult.embeddingSimilarity,
        fromCache: true,
      };
    }

    console.log(
      `[MatchingController] No cached analysis found, running fresh analysis for job ${jobId} and candidate ${candidateId}`,
    );

    // Get the job and candidate for fresh analysis
    const job = await this.matchingService.getJob(jobId, user.organizationId);
    const candidate = await this.matchingService.getCandidate(
      candidateId,
      user.organizationId,
    );

    if (!job || !candidate) {
      throw new NotFoundException('Job or candidate not found');
    }

    const aiAnalysis = await this.matchingService.analyzeJobCandidateMatch(
      job,
      candidate,
    );

    // For fresh analysis, we only have the AI analysis, not skill matches
    return {
      aiAnalysis,
      skillMatches: null,
      score: null,
      embeddingSimilarity: null,
      fromCache: false,
    };
  }
}
