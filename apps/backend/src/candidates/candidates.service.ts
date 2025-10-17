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
  CreateCandidateDto,
  CreateCandidateFromResumeDto,
  UpdateCandidateDto,
  CandidateQueryDto,
  MatchCandidatesDto,
  CandidateStatus,
  ParsedResumeData,
} from './dto/candidate.dto';

@Injectable()
export class CandidatesService {
  private readonly logger = new Logger(CandidatesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly openAiService: OpenAiService,
    private readonly fileParsingService: FileParsingService,
    private readonly s3Service: S3Service,
  ) {}

  private async ensureDefaultUserAndOrg(): Promise<{
    userId: string;
    organizationId: string;
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
          password: 'dummy-hash', // This would be properly hashed in production
        },
      });
    }

    return { userId: user.id, organizationId: organization.id };
  }

  async createCandidateFromResume(
    file: Express.Multer.File,
    organizationId: string,
    userId: string,
    additionalData?: CreateCandidateFromResumeDto,
  ): Promise<any> {
    try {
      // Ensure we have valid user and organization IDs
      const { userId: validUserId, organizationId: validOrgId } =
        await this.ensureDefaultUserAndOrg();

      // Use the valid IDs instead of dummy ones
      const actualOrgId =
        organizationId === 'dummy-org-id' ? validOrgId : organizationId;
      const actualUserId = userId === 'dummy-user-id' ? validUserId : userId;

      // Validate file
      this.fileParsingService.validateFileSize(file, 10);

      // Upload resume to S3 using S3Service
      const resumeBucket = process.env.S3_RESUME_BUCKET || 'resumes';
      const resumeKey = `${actualOrgId}/candidates/${Date.now()}_${file.originalname}`;
      const resumeUrl = await this.s3Service.uploadFile({
        bucket: resumeBucket,
        key: resumeKey,
        body: file.buffer,
        contentType: file.mimetype,
      });

      // Parse the resume file
      const resumeText = await this.fileParsingService.parseResumeFile(file);

      // Use OpenAI to parse the resume
      const parsedData = await this.openAiService.parseResume(resumeText);

      // Check if candidate with this email already exists
      const existingCandidate = await this.prisma.candidate.findFirst({
        where: {
          email: parsedData.personalInfo.email,
          organizationId: actualOrgId,
        },
      });

      if (existingCandidate) {
        throw new ConflictException(
          `Candidate with email ${parsedData.personalInfo.email} already exists`,
        );
      }

      // Create candidate from parsed data with structured fields
      const candidateData = {
        organizationId: actualOrgId,
        addedById: actualUserId,
        email: parsedData.personalInfo.email,
        firstName: parsedData.personalInfo.firstName,
        lastName: parsedData.personalInfo.lastName,
        phone: parsedData.personalInfo.phone,
        linkedin: parsedData.personalInfo.linkedin,
        github: parsedData.personalInfo.github,
        portfolio: parsedData.personalInfo.portfolio,
        location: parsedData.personalInfo.location,
        summary: parsedData.professionalSummary,

        // Experience and metadata
        yearsOfExperience: parsedData.metadata?.totalExperience || 0,
        currentRole: parsedData.metadata?.currentRole,
        expectedSalary:
          parsedData.metadata?.salaryExpectation?.max ||
          parsedData.metadata?.salaryExpectation?.min,

        // Structured JSON data from OpenAI
        experience: parsedData.experience || [],
        education: parsedData.education || [],
        skills: parsedData.skills || { technical: [], soft: [], languages: [] },
        certifications: parsedData.certifications || [],
        projects: parsedData.projects || [],
        industryExperience: parsedData.metadata?.industryExperience || [],
        salaryExpectation: parsedData.metadata?.salaryExpectation || undefined,

        // Basic tracking
        status: additionalData?.status || CandidateStatus.ACTIVE,
        source: additionalData?.source || 'resume_upload',
        notes: additionalData?.notes,

        // Resume file URL
        resumeUrl,

        // Generate comprehensive tags for search
        tags: this.generateSearchTags(parsedData),

        ...(additionalData?.companyId && {
          companyId: additionalData.companyId,
        }),
      };

      const candidate = await this.prisma.candidate.create({
        data: candidateData,
        include: {
          organization: true,
          applications: true,
        },
      });

      // Generate embedding for semantic matching
      try {
        const embedding =
          await this.openAiService.generateCandidateEmbedding(candidate);
        await this.prisma.candidate.update({
          where: { id: candidate.id },
          data: {
            embedding: JSON.stringify(embedding),
            embeddingModel: 'text-embedding-3-small',
            embeddingAt: new Date(),
          },
        });
        this.logger.log(`Generated embedding for candidate ${candidate.id}`);
      } catch (embeddingError) {
        this.logger.warn(
          `Failed to generate embedding for candidate ${candidate.id}:`,
          embeddingError,
        );
        // Don't fail the entire operation if embedding generation fails
      }

      this.logger.log(
        `Created candidate ${candidate.id} from resume for organization ${organizationId}`,
      );
      return candidate;
    } catch (error) {
      this.logger.error('Error creating candidate from resume:', error);
      throw error;
    }
  }

  async create(
    data: CreateCandidateDto,
    organizationId: string,
    userId: string,
  ): Promise<any> {
    // Check if candidate with this email already exists
    const existingCandidate = await this.prisma.candidate.findFirst({
      where: {
        email: data.email,
        organizationId,
      },
    });

    if (existingCandidate) {
      throw new ConflictException(
        `Candidate with email ${data.email} already exists`,
      );
    }

    const candidateData = {
      organizationId,
      addedById: userId,
      ...data,
      ...(data.companyId && { companyId: data.companyId }),
    };

    const candidate = await this.prisma.candidate.create({
      data: candidateData,
      include: {
        organization: true,
        applications: true,
      },
    });

    // Generate embedding for semantic matching
    try {
      const embedding =
        await this.openAiService.generateCandidateEmbedding(candidate);
      await this.prisma.candidate.update({
        where: { id: candidate.id },
        data: {
          embedding: JSON.stringify(embedding),
          embeddingModel: 'text-embedding-3-small',
          embeddingAt: new Date(),
        },
      });
      this.logger.log(`Generated embedding for candidate ${candidate.id}`);
    } catch (embeddingError) {
      this.logger.warn(
        `Failed to generate embedding for candidate ${candidate.id}:`,
        embeddingError,
      );
      // Don't fail the entire operation if embedding generation fails
    }

    return candidate;
  }

  async findAll(
    organizationId: string,
    query: CandidateQueryDto,
  ): Promise<{
    candidates: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Ensure we have valid organization ID
    const { organizationId: validOrgId } = await this.ensureDefaultUserAndOrg();
    const actualOrgId =
      organizationId === 'dummy-org-id' ? validOrgId : organizationId;

    const {
      page: rawPage = 1,
      limit: rawLimit = 20,
      search,
      status,
      location,
      skills,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    // Ensure page and limit are numbers
    const page = Number(rawPage) || 1;
    const limit = Number(rawLimit) || 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      organizationId: actualOrgId,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { summary: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (skills) {
      const skillsArray = skills.split(',').map((s) => s.trim());
      where.tags = {
        hasSome: skillsArray,
      };
    }

    // Count total for pagination
    const total = await this.prisma.candidate.count({ where });

    // Get candidates
    const candidates = await this.prisma.candidate.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
      include: {
        organization: true,
        applications: {
          include: {
            job: true,
          },
        },
      },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      candidates,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: string, organizationId: string): Promise<any> {
    // Ensure we have valid organization ID
    const { organizationId: validOrgId } = await this.ensureDefaultUserAndOrg();
    const actualOrgId =
      organizationId === 'dummy-org-id' ? validOrgId : organizationId;

    const candidate = await this.prisma.candidate.findFirst({
      where: {
        id,
        organizationId: actualOrgId,
      },
      include: {
        organization: true,
        applications: {
          include: {
            job: true,
          },
        },
      },
    });

    if (!candidate) {
      throw new NotFoundException(`Candidate with ID ${id} not found`);
    }

    return candidate;
  }

  async update(
    id: string,
    organizationId: string,
    data: UpdateCandidateDto,
  ): Promise<any> {
    const candidate = await this.findOne(id, organizationId);

    return this.prisma.candidate.update({
      where: { id: candidate.id },
      data,
      include: {
        organization: true,
        applications: true,
      },
    });
  }

  async remove(id: string, organizationId: string): Promise<any> {
    const candidate = await this.findOne(id, organizationId);

    return this.prisma.candidate.delete({
      where: { id: candidate.id },
    });
  }

  async matchCandidatesToJob(
    organizationId: string,
    matchData: MatchCandidatesDto,
  ): Promise<
    Array<{
      candidate: any;
      matchScore: number;
      matchDetails: any;
    }>
  > {
    // Get the job with embedding
    const job = await this.prisma.job.findFirst({
      where: {
        id: matchData.jobId,
        organizationId,
      },
    });

    if (!job) {
      throw new NotFoundException(`Job with ID ${matchData.jobId} not found`);
    }

    // Get candidates with AI data and embeddings
    const candidates = await this.prisma.candidate.findMany({
      where: {
        organizationId,
        status: CandidateStatus.ACTIVE,
      },
    });

    const matches: Array<{
      candidate: any;
      matchScore: number;
      matchDetails: any;
    }> = [];

    for (const candidate of candidates) {
      try {
        let matchScore = 0;
        let matchDetails: any = {
          skillsMatch: { matched: [], missing: [] },
          experienceMatch: false,
          overallFit: 'Unable to calculate match',
          strengths: [],
          concerns: ['Matching data unavailable'],
        };

        // Try embedding-based matching first
        if ((job as any).embedding && (candidate as any).embedding) {
          try {
            const jobEmbedding = JSON.parse((job as any).embedding);
            const candidateEmbedding = JSON.parse((candidate as any).embedding);

            const similarity = this.openAiService.calculateCosineSimilarity(
              candidateEmbedding,
              jobEmbedding,
            );

            matchScore = similarity;
            matchDetails = {
              skillsMatch: {
                matched: this.extractMatchedSkills(candidate, job),
                missing: this.extractMissingSkills(candidate, job),
              },
              experienceMatch: this.checkExperienceMatch(candidate, job),
              overallFit: this.generateOverallFit(similarity),
              strengths: this.extractStrengths(candidate, job),
              concerns: this.extractConcerns(candidate, job),
              matchingMethod: 'embedding-based',
              similarity: similarity,
            };

            this.logger.log(
              `Embedding match score for candidate ${candidate.id}: ${similarity}`,
            );
          } catch (embeddingError) {
            this.logger.warn(
              `Embedding matching failed for candidate ${candidate.id}:`,
              embeddingError,
            );
            // Fall back to basic matching
            const basicMatch = this.calculateBasicMatch(candidate, job);
            matchScore = basicMatch.matchScore;
            matchDetails = basicMatch.matchDetails;
          }
        } else {
          // Use basic rule-based matching as fallback
          const basicMatch = this.calculateBasicMatch(candidate, job);
          matchScore = basicMatch.matchScore;
          matchDetails = basicMatch.matchDetails;
        }

        if (matchScore >= (matchData.minMatchScore || 0.7)) {
          matches.push({
            candidate,
            matchScore,
            matchDetails,
          });
        }
      } catch (error) {
        this.logger.warn(`Failed to match candidate ${candidate.id}:`, error);
      }
    }

    // Sort by match score (highest first) and limit results
    return matches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, matchData.limit || 10);
  }

  private determineExperienceLevel(yearsOfExperience: number): string {
    if (yearsOfExperience < 2) return 'junior';
    if (yearsOfExperience < 5) return 'mid';
    if (yearsOfExperience < 8) return 'senior';
    if (yearsOfExperience < 12) return 'lead';
    return 'executive';
  }

  private generateSearchTags(parsedData: ParsedResumeData): string[] {
    const tags: string[] = [];

    // Add technical and soft skills
    if (parsedData.skills?.technical) {
      tags.push(...parsedData.skills.technical);
    }
    if (parsedData.skills?.soft) {
      tags.push(...parsedData.skills.soft);
    }

    // Add technologies from experience
    if (parsedData.experience && Array.isArray(parsedData.experience)) {
      parsedData.experience.forEach((exp: any) => {
        if (exp.technologies && Array.isArray(exp.technologies)) {
          tags.push(...exp.technologies);
        }
      });
    }

    // Add technologies from projects
    if (parsedData.projects && Array.isArray(parsedData.projects)) {
      parsedData.projects.forEach((project: any) => {
        if (project.technologies && Array.isArray(project.technologies)) {
          tags.push(...project.technologies);
        }
      });
    }

    // Add industry experience
    if (
      parsedData.metadata?.industryExperience &&
      Array.isArray(parsedData.metadata.industryExperience)
    ) {
      tags.push(...parsedData.metadata.industryExperience);
    }

    // Add education institutions and degrees
    if (parsedData.education && Array.isArray(parsedData.education)) {
      parsedData.education.forEach((edu: any) => {
        if (edu.institution) tags.push(edu.institution);
        if (edu.degree) tags.push(edu.degree);
      });
    }

    // Add certification names
    if (parsedData.certifications && Array.isArray(parsedData.certifications)) {
      parsedData.certifications.forEach((cert: any) => {
        if (cert.name) tags.push(cert.name);
        if (cert.issuer) tags.push(cert.issuer);
      });
    }

    // Add languages
    if (
      parsedData.skills?.languages &&
      Array.isArray(parsedData.skills.languages)
    ) {
      parsedData.skills.languages.forEach((lang: any) => {
        if (lang.language) tags.push(lang.language);
      });
    }

    // Remove duplicates, clean up, and return
    return [...new Set(tags)]
      .filter((tag) => tag && typeof tag === 'string' && tag.trim().length > 0)
      .map((tag) => tag.trim().toLowerCase())
      .filter((tag) => tag.length > 1); // Remove single characters
  }

  // Helper methods for matching analysis
  private calculateBasicMatch(
    candidate: any,
    job: any,
  ): { matchScore: number; matchDetails: any } {
    let score = 0;
    const matched: string[] = [];
    const missing: string[] = [];
    const concerns: string[] = [];
    const strengths: string[] = [];

    // Basic skill matching using tags
    if (candidate.tags && Array.isArray(candidate.tags) && job.requirements) {
      const jobSkills = job.requirements.toLowerCase().split(/[,\s]+/);
      const candidateSkills = candidate.tags.map((tag: string) =>
        tag.toLowerCase(),
      );

      jobSkills.forEach((skill: string) => {
        if (skill.length > 2 && candidateSkills.includes(skill)) {
          matched.push(skill);
          score += 0.1;
        } else if (skill.length > 2) {
          missing.push(skill);
        }
      });
    }

    // Experience level matching
    const experienceMatch = this.checkExperienceMatch(candidate, job);
    if (experienceMatch) {
      score += 0.3;
      strengths.push('Experience level alignment');
    } else {
      concerns.push('Experience level mismatch');
    }

    // Location matching
    if (job.remote || !job.location || !candidate.location) {
      score += 0.1;
    } else if (
      candidate.location &&
      job.location &&
      candidate.location.toLowerCase().includes(job.location.toLowerCase())
    ) {
      score += 0.1;
      strengths.push('Location match');
    } else {
      concerns.push('Location mismatch');
    }

    // Ensure score is between 0 and 1
    score = Math.min(1, Math.max(0, score));

    return {
      matchScore: score,
      matchDetails: {
        skillsMatch: { matched, missing },
        experienceMatch,
        overallFit: this.generateOverallFit(score),
        strengths,
        concerns,
        matchingMethod: 'rule-based',
      },
    };
  }

  private extractMatchedSkills(candidate: any, job: any): string[] {
    if (!candidate.tags || !job.requirements) return [];

    const jobSkills = job.requirements.toLowerCase().split(/[,\s]+/);
    const candidateSkills = candidate.tags.map((tag: string) =>
      tag.toLowerCase(),
    );

    return jobSkills.filter(
      (skill: string) => skill.length > 2 && candidateSkills.includes(skill),
    );
  }

  private extractMissingSkills(candidate: any, job: any): string[] {
    if (!candidate.tags || !job.requirements) return [];

    const jobSkills = job.requirements.toLowerCase().split(/[,\s]+/);
    const candidateSkills = candidate.tags.map((tag: string) =>
      tag.toLowerCase(),
    );

    return jobSkills.filter(
      (skill: string) => skill.length > 2 && !candidateSkills.includes(skill),
    );
  }

  private checkExperienceMatch(candidate: any, job: any): boolean {
    if (!candidate.yearsOfExperience || !job.level) return true;

    const candidateYears = candidate.yearsOfExperience;
    const jobLevel = job.level.toLowerCase();

    switch (jobLevel) {
      case 'entry':
        return candidateYears >= 0 && candidateYears <= 2;
      case 'junior':
        return candidateYears >= 1 && candidateYears <= 3;
      case 'mid':
        return candidateYears >= 2 && candidateYears <= 5;
      case 'senior':
        return candidateYears >= 4 && candidateYears <= 8;
      case 'lead':
        return candidateYears >= 6 && candidateYears <= 12;
      case 'principal':
        return candidateYears >= 8;
      case 'executive':
        return candidateYears >= 10;
      default:
        return true;
    }
  }

  private generateOverallFit(score: number): string {
    if (score >= 0.9) return 'Exceptional match - ideal candidate';
    if (score >= 0.8) return 'Strong match - highly recommended';
    if (score >= 0.7) return 'Good match - worth interviewing';
    if (score >= 0.6) return 'Moderate match - has potential';
    if (score >= 0.5) return 'Weak match - significant gaps';
    return 'Poor match - not recommended';
  }

  private extractStrengths(candidate: any, job: any): string[] {
    const strengths: string[] = [];

    if (this.checkExperienceMatch(candidate, job)) {
      strengths.push('Experience level alignment');
    }

    if (candidate.yearsOfExperience > 5) {
      strengths.push('Experienced professional');
    }

    if (
      job.remote ||
      !job.location ||
      (candidate.location &&
        job.location &&
        candidate.location.toLowerCase().includes(job.location.toLowerCase()))
    ) {
      strengths.push('Location compatibility');
    }

    const matchedSkills = this.extractMatchedSkills(candidate, job);
    if (matchedSkills.length > 3) {
      strengths.push('Strong technical skill match');
    }

    return strengths;
  }

  private extractConcerns(candidate: any, job: any): string[] {
    const concerns: string[] = [];

    if (!this.checkExperienceMatch(candidate, job)) {
      concerns.push('Experience level mismatch');
    }

    if (
      !job.remote &&
      job.location &&
      candidate.location &&
      !candidate.location.toLowerCase().includes(job.location.toLowerCase())
    ) {
      concerns.push('Location mismatch');
    }

    const missingSkills = this.extractMissingSkills(candidate, job);
    if (missingSkills.length > 2) {
      concerns.push('Missing key technical skills');
    }

    if (concerns.length === 0) {
      concerns.push('No major concerns identified');
    }

    return concerns;
  }
}
