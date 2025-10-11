import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';

export interface MatchingResult {
  candidateId: string;
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    skills: string[];
    experience: number;
    summary?: string;
  };
  score: number;
  embeddingSimilarity: number;
  aiAnalysis?: {
    overallMatch: number;
    strengths: string[];
    weaknesses: string[];
    reasoning: string;
    recommendation:
      | 'highly_recommended'
      | 'recommended'
      | 'consider'
      | 'not_recommended';
  };
  skillMatches: {
    required: string[];
    matched: string[];
    missing: string[];
    additional: string[];
  };
}

export interface MatchingCriteria {
  requiredSkills?: string[];
  preferredSkills?: string[];
  minExperience?: number;
  maxExperience?: number;
  jobLevel?: string;
  location?: string;
  remote?: boolean;
}

@Injectable()
export class MatchingService {
  private openai: OpenAI;

  constructor(private prisma: PrismaService) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Find top candidates using embedding similarity, then enhance with AI analysis
   * Uses cached results when available and not expired (24 hours)
   */
  async findBestCandidatesForJob(
    jobId: string,
    organizationId: string,
    limit: number = 5,
  ): Promise<MatchingResult[]> {
    // Check for cached results first
    const cachedResults = await this.getCachedMatchingResults(
      jobId,
      organizationId,
      limit,
    );
    if (cachedResults && cachedResults.length > 0) {
      console.log(
        `[MatchingService] Using ${cachedResults.length} cached results for job ${jobId}`,
      );
      return cachedResults;
    }

    console.log(
      `[MatchingService] No cached results found, calculating fresh matches for job ${jobId}`,
    );

    // Get job with embeddings
    const job = await this.prisma.job.findUnique({
      where: {
        id: jobId,
        organizationId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        requirements: true,
        location: true,
        salaryMin: true,
        salaryMax: true,
        embedding: true,
        requirementsDetailed: true,
        jobInfo: true,
        responsibilities: true,
        benefits: true,
        applicationInfo: true,
        metadata: true,
      },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    // Find candidates using embedding similarity
    const topCandidates = await this.findCandidatesByEmbedding(
      job,
      organizationId,
      limit * 2, // Get more candidates for better selection
    );

    // Enhance top candidates with AI analysis
    const enhancedResults = await Promise.all(
      topCandidates.slice(0, limit).map(async (candidate) => {
        const aiAnalysis = await this.analyzeJobCandidateMatch(job, candidate);
        return {
          ...candidate,
          aiAnalysis,
          score: this.calculateCompositeScore(
            candidate.embeddingSimilarity,
            aiAnalysis,
          ),
        };
      }),
    );

    // Sort by final composite score
    const sortedResults = enhancedResults.sort((a, b) => b.score - a.score);

    // Cache the results in background (don't await to avoid slowing response)
    this.cacheMatchingResults(jobId, organizationId, sortedResults).catch(
      (error) => {
        console.warn('[MatchingService] Failed to cache results:', error);
      },
    );

    return sortedResults;
  }

  /**
   * Find candidates using vector similarity on embeddings
   * Fixed table name casing for PostgreSQL
   */
  private async findCandidatesByEmbedding(
    job: any,
    organizationId: string,
    limit: number,
  ): Promise<Omit<MatchingResult, 'aiAnalysis' | 'score'>[]> {
    if (!job.embedding) {
      throw new Error(
        'Job does not have embeddings. Please regenerate embeddings for this job.',
      );
    }

    // Parse job embedding from JSON string
    let jobEmbedding: number[];
    try {
      jobEmbedding =
        typeof job.embedding === 'string'
          ? JSON.parse(job.embedding)
          : job.embedding;
    } catch (error) {
      throw new Error('Invalid job embedding format');
    }

    // Find candidates with embeddings using regular SQL with cosine similarity calculation
    const candidates = (await this.prisma.$queryRaw`
      SELECT 
        c.id,
        c."firstName",
        c."lastName",
        c.email,
        c.skills,
        c."yearsOfExperience" as experience,
        c.summary,
        c."embedding"
      FROM "candidates" c
      WHERE 
        c."organizationId" = ${organizationId}
        AND c."embedding" IS NOT NULL
        AND c.status NOT IN ('REJECTED', 'BLACKLISTED')
      LIMIT 50
    `) as any[];

    // Calculate cosine similarity in JavaScript since pgvector is not available
    const candidatesWithSimilarity = candidates.map((candidate) => {
      let candidateEmbedding: number[];
      try {
        candidateEmbedding =
          typeof candidate.embedding === 'string'
            ? JSON.parse(candidate.embedding)
            : candidate.embedding;
      } catch (error) {
        return { ...candidate, similarity: 0 };
      }

      const similarity = this.calculateCosineSimilarity(
        jobEmbedding,
        candidateEmbedding,
      );
      return { ...candidate, similarity };
    });

    // Sort by similarity and take top results
    candidatesWithSimilarity.sort((a, b) => b.similarity - a.similarity);
    const topCandidates = candidatesWithSimilarity.slice(0, limit);

    return topCandidates.map((candidate) => ({
      candidateId: candidate.id,
      candidate: {
        id: candidate.id,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        skills: Array.isArray(candidate.skills) ? candidate.skills : [],
        experience: candidate.experience || 0,
        summary: candidate.summary,
      },
      embeddingSimilarity: parseFloat(candidate.similarity) || 0,
      skillMatches: this.analyzeSkillMatches(job, candidate),
    }));
  }

  /**
   * Analyze a specific job-candidate match using AI
   */
  async analyzeJobCandidateMatch(
    job: any,
    candidate: any,
  ): Promise<MatchingResult['aiAnalysis']> {
    // Handle both MatchingResult candidate format and raw database candidate format
    const candidateData = candidate.candidate || candidate;
    const embeddingSimilarity = candidate.embeddingSimilarity || 0;

    const prompt = `
You are an expert technical recruiter. Analyze how well this candidate matches the job requirements.

JOB DETAILS:
Title: ${job.title}
Description: ${job.description}
Requirements: ${job.requirements || 'Not specified'}
Level: ${job.level || 'Not specified'}
Type: ${job.type || 'Not specified'}
Required Skills: ${this.extractJobSkills(job).join(', ') || 'Not specified'}

CANDIDATE DETAILS:
Name: ${candidateData.firstName} ${candidateData.lastName}
Experience: ${candidateData.yearsOfExperience || candidateData.experience || 0} years
Skills: ${this.extractSkillsArray(candidateData.skills).join(', ')}
Summary: ${candidateData.summary || 'Not provided'}
Embedding Similarity Score: ${embeddingSimilarity.toFixed(3)}

ANALYSIS REQUIREMENTS:
1. Overall match score (0-100)
2. Top 3 strengths that make this candidate suitable
3. Top 3 potential concerns or weaknesses
4. Detailed reasoning for the match assessment
5. Final recommendation level

Respond in JSON format:
{
  "overallMatch": <number 0-100>,
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "reasoning": "Detailed explanation of why this candidate is/isn't a good match",
  "recommendation": "highly_recommended|recommended|consider|not_recommended"
}
`;

    console.log('OpenAI Prompt:', prompt);

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert technical recruiter with deep knowledge of software engineering roles and candidate assessment. Provide accurate, unbiased analysis.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      let responseContent = response.choices[0].message.content || '{}';

      // Remove markdown code blocks and other common formatting
      responseContent = responseContent
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .replace(/`+/g, '')
        .trim();

      // Find JSON content between braces
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        responseContent = jsonMatch[0];
      }

      try {
        const analysis = JSON.parse(responseContent);
        return {
          overallMatch: Math.min(100, Math.max(0, analysis.overallMatch || 0)),
          strengths: analysis.strengths || [],
          weaknesses: analysis.weaknesses || [],
          reasoning: analysis.reasoning || 'Analysis not available',
          recommendation: analysis.recommendation || 'consider',
        };
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('Raw OpenAI response:', responseContent);
        throw parseError;
      }
    } catch (error) {
      console.error('Error in OpenAI analysis:', error);
      return {
        overallMatch: Math.round((candidate.embeddingSimilarity || 0) * 100),
        strengths: ['Embedding similarity indicates potential match'],
        weaknesses: ['AI analysis unavailable'],
        reasoning:
          'Unable to perform detailed AI analysis. Score based on embedding similarity.',
        recommendation:
          candidate.embeddingSimilarity > 0.7 ? 'recommended' : 'consider',
      };
    }
  }

  /**
   * Calculate composite score combining embedding similarity and AI analysis
   */
  private calculateCompositeScore(
    embeddingSimilarity: number,
    aiAnalysis?: MatchingResult['aiAnalysis'],
  ): number {
    if (!aiAnalysis) {
      return embeddingSimilarity * 100;
    }

    // Weight: 40% embedding similarity, 60% AI analysis
    const embeddingWeight = 0.4;
    const aiWeight = 0.6;

    return (
      embeddingSimilarity * 100 * embeddingWeight +
      aiAnalysis.overallMatch * aiWeight
    );
  }

  /**
   * Analyze skill matches between job and candidate
   */
  private analyzeSkillMatches(
    job: any,
    candidate: any,
  ): MatchingResult['skillMatches'] {
    // Extract skills using the new method that handles OpenAI format
    const jobSkills = this.normalizeSkills(this.extractJobSkills(job));
    const candidateSkills = this.normalizeSkills(
      this.extractSkillsArray(candidate.skills),
    );

    // Only extract from job description text if no structured skills are available
    let allJobSkills = jobSkills;
    if (jobSkills.length === 0) {
      const jobDescriptionSkills = this.extractSkillsFromText(
        job.description + ' ' + (job.requirements || ''),
      );
      allJobSkills = [...new Set([...jobSkills, ...jobDescriptionSkills])];
    }

    const matched = candidateSkills.filter((skill) =>
      allJobSkills.some((jobSkill) => this.skillsMatch(skill, jobSkill)),
    );

    const missing = allJobSkills.filter(
      (jobSkill) =>
        !candidateSkills.some((candidateSkill) =>
          this.skillsMatch(candidateSkill, jobSkill),
        ),
    );

    const additional = candidateSkills.filter(
      (skill) =>
        !allJobSkills.some((jobSkill) => this.skillsMatch(skill, jobSkill)),
    );

    return {
      required: allJobSkills,
      matched,
      missing,
      additional,
    };
  }

  /**
   * Safely extract skills array from JSON field or array
   * Handles complex skills objects with soft, technical, and languages properties
   */
  private extractSkillsArray(skills: any): string[] {
    if (!skills) return [];

    // If it's already an array, return as is
    if (Array.isArray(skills)) {
      return skills.filter((skill) => typeof skill === 'string');
    }

    // If it's a string, try to parse as JSON
    if (typeof skills === 'string') {
      try {
        const parsed = JSON.parse(skills);
        return this.extractSkillsFromParsedObject(parsed);
      } catch (e) {
        // If parsing fails, treat as single skill
        return [skills];
      }
    }

    // If it's already an object, extract skills from it
    if (typeof skills === 'object') {
      return this.extractSkillsFromParsedObject(skills);
    }

    return [];
  }

  /**
   * Extract skills from parsed skills object
   */
  private extractSkillsFromParsedObject(parsed: any): string[] {
    const allSkills: string[] = [];

    // Handle array format
    if (Array.isArray(parsed)) {
      return parsed.filter((skill) => typeof skill === 'string');
    }

    // Handle object format with soft, technical, languages properties
    if (typeof parsed === 'object' && parsed !== null) {
      // Extract technical skills
      if (Array.isArray(parsed.technical)) {
        allSkills.push(
          ...parsed.technical.filter((skill: any) => typeof skill === 'string'),
        );
      }

      // Extract soft skills
      if (Array.isArray(parsed.soft)) {
        allSkills.push(
          ...parsed.soft.filter((skill: any) => typeof skill === 'string'),
        );
      }

      // Extract languages (just the language names)
      if (Array.isArray(parsed.languages)) {
        const languageNames = parsed.languages
          .filter((lang: any) => typeof lang === 'object' && lang.language)
          .map((lang: any) => lang.language);
        allSkills.push(...languageNames);
      }

      // Handle other array properties that might contain skills
      Object.values(parsed).forEach((value: any) => {
        if (Array.isArray(value)) {
          const stringSkills = value.filter(
            (item: any) => typeof item === 'string',
          );
          allSkills.push(...stringSkills);
        }
      });
    }

    // Remove duplicates and return
    return [...new Set(allSkills)];
  }

  /**
   * Normalize skills for better matching
   */
  private normalizeSkills(skills: string[]): string[] {
    return skills.map((skill) => skill.toLowerCase().trim());
  }

  /**
   * Check if two skills match (handles variations like "JS" vs "JavaScript")
   */
  private skillsMatch(skill1: string, skill2: string): boolean {
    const s1 = skill1.toLowerCase();
    const s2 = skill2.toLowerCase();

    if (s1 === s2) return true;

    // Handle common skill variations
    const variations: Record<string, string[]> = {
      javascript: ['js', 'javascript', 'node.js', 'nodejs'],
      typescript: ['ts', 'typescript'],
      python: ['python', 'py'],
      react: ['react', 'reactjs', 'react.js'],
      vue: ['vue', 'vuejs', 'vue.js'],
      angular: ['angular', 'angularjs'],
    };

    for (const [key, variants] of Object.entries(variations)) {
      if (variants.includes(s1) && variants.includes(s2)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Extract technical skills from text using common patterns
   */
  private extractSkillsFromText(text: string): string[] {
    const commonSkills = [
      'javascript',
      'typescript',
      'python',
      'java',
      'c++',
      'c#',
      'go',
      'rust',
      'php',
      'ruby',
      'react',
      'vue',
      'angular',
      'svelte',
      'next.js',
      'nuxt.js',
      'node.js',
      'express',
      'fastapi',
      'django',
      'flask',
      'spring',
      'asp.net',
      'mongodb',
      'postgresql',
      'mysql',
      'redis',
      'elasticsearch',
      'aws',
      'azure',
      'gcp',
      'docker',
      'kubernetes',
      'terraform',
      'git',
      'ci/cd',
      'jenkins',
      'github actions',
      'machine learning',
      'ai',
      'data science',
      'tensorflow',
      'pytorch',
    ];

    const lowerText = text.toLowerCase();
    return commonSkills.filter((skill) => lowerText.includes(skill));
  }

  /**
   * Find similar candidates based on skills and experience
   */
  async findSimilarCandidates(
    candidateId: string,
    organizationId: string,
    limit: number = 5,
  ): Promise<MatchingResult[]> {
    const candidate = await this.prisma.candidate.findFirst({
      where: { id: candidateId, organizationId },
    });

    if (!candidate || !candidate.embedding) {
      throw new Error('Candidate not found or missing embeddings');
    }

    // Parse candidate embedding from JSON string
    let candidateEmbedding: number[];
    try {
      candidateEmbedding =
        typeof candidate.embedding === 'string'
          ? JSON.parse(candidate.embedding)
          : candidate.embedding;
    } catch (error) {
      throw new Error('Invalid candidate embedding format');
    }

    // Find similar candidates with embeddings using regular SQL
    const candidates = (await this.prisma.$queryRaw`
      SELECT 
        c.id,
        c."firstName",
        c."lastName",
        c.email,
        c.skills,
        c."yearsOfExperience" as experience,
        c.summary,
        c."embedding"
      FROM "candidates" c
      WHERE 
        c."organizationId" = ${organizationId}
        AND c.id != ${candidateId}
        AND c."embedding" IS NOT NULL
        AND c.status NOT IN ('REJECTED', 'BLACKLISTED')
      LIMIT 50
    `) as any[];

    // Calculate cosine similarity in JavaScript since pgvector is not available
    const candidatesWithSimilarity = candidates.map((c) => {
      let cEmbedding: number[];
      try {
        cEmbedding =
          typeof c.embedding === 'string'
            ? JSON.parse(c.embedding)
            : c.embedding;
      } catch (error) {
        return { ...c, similarity: 0 };
      }

      const similarity = this.calculateCosineSimilarity(
        candidateEmbedding,
        cEmbedding,
      );
      return { ...c, similarity };
    });

    // Sort by similarity and take top results
    candidatesWithSimilarity.sort((a, b) => b.similarity - a.similarity);
    const topCandidates = candidatesWithSimilarity.slice(0, limit);

    return topCandidates.map((c) => ({
      candidateId: c.id,
      candidate: {
        id: c.id,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        skills: Array.isArray(c.skills) ? c.skills : [],
        experience: c.experience || 0,
        summary: c.summary,
      },
      score: parseFloat(c.similarity) * 100,
      embeddingSimilarity: parseFloat(c.similarity),
      skillMatches: this.analyzeSkillMatches(candidate, c),
      aiAnalysis: undefined, // Will be populated if needed
    }));
  }

  /**
   * Get job by ID for the organization
   */
  async getJob(jobId: string, organizationId: string) {
    return this.prisma.job.findUnique({
      where: { id: jobId, organizationId },
    });
  }

  /**
   * Get candidate by ID for the organization
   */
  async getCandidate(candidateId: string, organizationId: string) {
    return this.prisma.candidate.findUnique({
      where: { id: candidateId, organizationId },
    });
  }

  /**
   * Extract skills from job's OpenAI structured format
   */
  private extractJobSkills(job: any): string[] {
    const allSkills: string[] = [];

    // Extract from requirementsDetailed.skills (OpenAI format)
    if (job.requirementsDetailed?.skills) {
      const skills = job.requirementsDetailed.skills;

      if (Array.isArray(skills.technical)) {
        allSkills.push(...skills.technical);
      }

      if (Array.isArray(skills.soft)) {
        allSkills.push(...skills.soft);
      }
    }

    // Fallback: extract from flat skills field (legacy)
    if (allSkills.length === 0 && job.skills && Array.isArray(job.skills)) {
      allSkills.push(...job.skills);
    }

    // Last resort: extract from requirements text
    if (allSkills.length === 0 && job.requirements) {
      const extractedSkills = this.extractSkillsFromText(job.requirements);
      allSkills.push(...extractedSkills);
    }

    // Remove duplicates
    return [
      ...new Set(
        allSkills.filter((skill) => skill && typeof skill === 'string'),
      ),
    ];
  }

  /**
   * Calculate cosine similarity between two vectors
   * Used as fallback when pgvector extension is not available
   */
  private calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) {
      return 0;
    }

    return dotProduct / denominator;
  }

  /**
   * Get cached matching results if they exist and haven't expired (24 hours)
   */
  private async getCachedMatchingResults(
    jobId: string,
    organizationId: string,
    limit: number,
  ): Promise<MatchingResult[] | null> {
    const now = new Date();

    const cachedResults = await this.prisma.matchingResult.findMany({
      where: {
        jobId,
        organizationId,
        expiresAt: {
          gt: now, // Only get non-expired results
        },
      },
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            skills: true,
            yearsOfExperience: true,
            summary: true,
          },
        },
      },
      orderBy: {
        score: 'desc',
      },
      take: limit,
    });

    if (cachedResults.length === 0) {
      return null;
    }

    // Convert cached results to MatchingResult format
    return cachedResults.map((cached) => ({
      candidateId: cached.candidateId,
      candidate: {
        id: cached.candidate.id,
        firstName: cached.candidate.firstName,
        lastName: cached.candidate.lastName,
        email: cached.candidate.email,
        skills: this.extractSkillsFromCandidate(cached.candidate),
        experience: cached.candidate.yearsOfExperience || 0,
        summary: cached.candidate.summary || undefined,
      },
      score: cached.score,
      embeddingSimilarity: cached.embeddingSimilarity,
      skillMatches: cached.skillMatches as any,
      aiAnalysis: cached.aiAnalysis as any,
    }));
  }

  /**
   * Get a single cached matching result for a specific job and candidate
   */
  async getCachedSingleMatchingResult(
    jobId: string,
    candidateId: string,
    organizationId: string,
  ): Promise<MatchingResult | null> {
    const now = new Date();

    const cachedResult = await this.prisma.matchingResult.findFirst({
      where: {
        jobId,
        candidateId,
        organizationId,
        expiresAt: {
          gt: now, // Only get non-expired results
        },
      },
      include: {
        candidate: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            skills: true,
            yearsOfExperience: true,
            summary: true,
          },
        },
      },
    });

    if (!cachedResult) {
      return null;
    }

    // Convert cached result to MatchingResult format
    return {
      candidateId: cachedResult.candidateId,
      candidate: {
        id: cachedResult.candidate.id,
        firstName: cachedResult.candidate.firstName,
        lastName: cachedResult.candidate.lastName,
        email: cachedResult.candidate.email,
        skills: this.extractSkillsFromCandidate(cachedResult.candidate),
        experience: cachedResult.candidate.yearsOfExperience || 0,
        summary: cachedResult.candidate.summary || undefined,
      },
      score: cachedResult.score,
      embeddingSimilarity: cachedResult.embeddingSimilarity,
      skillMatches: cachedResult.skillMatches as any,
      aiAnalysis: cachedResult.aiAnalysis as any,
    };
  }

  /**
   * Cache matching results with expiration time
   */
  private async cacheMatchingResults(
    jobId: string,
    organizationId: string,
    results: MatchingResult[],
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // Cache for 24 hours

    // Use upsert to handle potential duplicates
    const cachePromises = results.map((result) =>
      this.prisma.matchingResult.upsert({
        where: {
          jobId_candidateId: {
            jobId,
            candidateId: result.candidateId,
          },
        },
        update: {
          score: result.score,
          embeddingSimilarity: result.embeddingSimilarity,
          skillMatches: result.skillMatches,
          aiAnalysis: result.aiAnalysis,
          calculatedAt: new Date(),
          expiresAt,
        },
        create: {
          jobId,
          candidateId: result.candidateId,
          organizationId,
          score: result.score,
          embeddingSimilarity: result.embeddingSimilarity,
          skillMatches: result.skillMatches,
          aiAnalysis: result.aiAnalysis,
          expiresAt,
        },
      }),
    );

    await Promise.all(cachePromises);
    console.log(
      `[MatchingService] Cached ${results.length} matching results for job ${jobId}`,
    );
  }

  /**
   * Clear expired cache entries (can be called periodically)
   */
  async clearExpiredCache(): Promise<void> {
    const now = new Date();
    const deleted = await this.prisma.matchingResult.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });
    console.log(
      `[MatchingService] Cleared ${deleted.count} expired cache entries`,
    );
  }

  /**
   * Invalidate cache for a specific job (e.g., when job is updated)
   */
  async invalidateJobCache(
    jobId: string,
    organizationId: string,
  ): Promise<void> {
    const deleted = await this.prisma.matchingResult.deleteMany({
      where: {
        jobId,
        organizationId,
      },
    });
    console.log(
      `[MatchingService] Invalidated cache for job ${jobId}, removed ${deleted.count} entries`,
    );
  }

  /**
   * Invalidate cache for a specific candidate (e.g., when candidate is updated)
   */
  async invalidateCandidateCache(
    candidateId: string,
    organizationId: string,
  ): Promise<void> {
    const deleted = await this.prisma.matchingResult.deleteMany({
      where: {
        candidateId,
        organizationId,
      },
    });
    console.log(
      `[MatchingService] Invalidated cache for candidate ${candidateId}, removed ${deleted.count} entries`,
    );
  }

  /**
   * Extract skills from candidate object (handles both array and JSON formats)
   */
  private extractSkillsFromCandidate(candidate: any): string[] {
    if (!candidate.skills) return [];

    if (Array.isArray(candidate.skills)) {
      return candidate.skills;
    }

    if (typeof candidate.skills === 'object' && candidate.skills.technical) {
      return candidate.skills.technical || [];
    }

    return [];
  }
}
