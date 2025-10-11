import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { ParsedResumeData } from '../candidates/dto/candidate.dto';
import { ParsedJobData } from '../jobs/dto/job.dto';

@Injectable()
export class OpenAiService {
  private readonly logger = new Logger(OpenAiService.name);
  private readonly openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async parseResume(resumeText: string): Promise<ParsedResumeData> {
    try {
      const prompt = this.createResumeParsingPrompt(resumeText);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert resume parser. Extract structured data from resumes and return it as valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      console.log('OpenAI response:', response.choices[0].message.content);

      const parsedData = JSON.parse(
        response.choices[0].message.content || '{}',
      );
      return this.validateAndCleanParsedData(parsedData);
    } catch (error) {
      this.logger.error('Error parsing resume with OpenAI:', error);
      throw new Error('Failed to parse resume');
    }
  }

  async matchCandidateToJob(
    candidateData: ParsedResumeData,
    jobDescription: string,
    jobRequirements: string[],
  ): Promise<{
    matchScore: number;
    matchDetails: {
      skillsMatch: { matched: string[]; missing: string[] };
      experienceMatch: boolean;
      overallFit: string;
      strengths: string[];
      concerns: string[];
    };
  }> {
    try {
      const prompt = this.createJobMatchingPrompt(
        candidateData,
        jobDescription,
        jobRequirements,
      );

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert recruiter. Analyze candidate-job fit and provide detailed matching insights.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      return JSON.parse(response.choices[0].message.content || '{}');
    } catch (error) {
      this.logger.error('Error matching candidate to job:', error);
      throw new Error('Failed to match candidate to job');
    }
  }

  async generateJobDescription(
    jobTitle: string,
    company: string,
    requirements: string[],
    benefits?: string[],
  ): Promise<string> {
    try {
      const prompt = this.createJobDescriptionPrompt(
        jobTitle,
        company,
        requirements,
        benefits,
      );

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a professional job posting writer. Create engaging and comprehensive job descriptions.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
      });

      return response.choices[0].message.content || '';
    } catch (error) {
      this.logger.error('Error generating job description:', error);
      throw new Error('Failed to generate job description');
    }
  }

  private createResumeParsingPrompt(resumeText: string): string {
    return `
Parse the following resume and extract structured information. Return a JSON object with the following structure:

{
  "personalInfo": {
    "firstName": "string",
    "lastName": "string", 
    "email": "string",
    "phone": "string (optional)",
    "location": "string (optional)",
    "linkedin": "string (optional)",
    "github": "string (optional)",
    "portfolio": "string (optional)"
  },
  "professionalSummary": "string (optional)",
  "experience": [
    {
      "title": "string",
      "company": "string",
      "startDate": "YYYY-MM format",
      "endDate": "YYYY-MM format or null if current",
      "description": "string",
      "technologies": ["array of technologies used"]
    }
  ],
  "education": [
    {
      "degree": "string",
      "institution": "string", 
      "graduationDate": "YYYY format (optional)",
      "gpa": "string (optional)"
    }
  ],
  "skills": {
    "technical": ["array of technical skills"],
    "soft": ["array of soft skills"],
    "languages": [
      {
        "language": "string",
        "proficiency": "native|fluent|intermediate|basic"
      }
    ]
  },
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "date": "YYYY-MM format (optional)"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["array of technologies"],
      "url": "string (optional)"
    }
  ],
  "metadata": {
    "totalExperience": "number (years of experience)",
    "currentRole": "string (optional)",
    "industryExperience": ["array of industries"],
    "salaryExpectation": {
      "min": "number (optional)",
      "max": "number (optional)", 
      "currency": "USD|EUR|GBP etc (optional)"
    }
  }
}

Resume text:
${resumeText}

Important: 
- Return only valid JSON
- Use null for missing optional fields
- Extract all skills mentioned, including programming languages, frameworks, tools
- Calculate total experience based on work history
- Be consistent with date formats
- If information is unclear or missing, use null rather than guessing
`;
  }

  private createJobMatchingPrompt(
    candidateData: ParsedResumeData,
    jobDescription: string,
    jobRequirements: string[],
  ): string {
    return `
You are an expert AI recruiter performing advanced candidate-job matching analysis.

Analyze the compatibility between this candidate and job using structured data comparison. Both candidate and job data are parsed with matching schemas for optimal alignment analysis.

CANDIDATE PROFILE:
${JSON.stringify(candidateData, null, 2)}

JOB REQUIREMENTS:
${jobDescription}

ADDITIONAL REQUIREMENTS:
${jobRequirements.join(', ')}

Return a comprehensive matching analysis as JSON:

{
  "matchScore": "number between 0.0 and 1.0 (e.g., 0.85 = 85% match)",
  "matchDetails": {
    "skillsMatch": {
      "matched": ["specific skills that align between candidate and job"],
      "missing": ["critical skills candidate lacks"],
      "bonus": ["candidate skills that exceed job requirements"]
    },
    "experienceMatch": {
      "levelAlignment": "boolean - does experience level match job requirements",
      "yearsComparison": "string - how candidate years compare to job needs",
      "relevantExperience": ["industries/roles relevant to this job"]
    },
    "compensationFit": {
      "salaryAlignment": "boolean - do salary expectations match job offer",
      "salaryGap": "string description of any compensation misalignment"
    },
    "locationMatch": {
      "compatible": "boolean - location/remote preferences align",
      "details": "string explaining location compatibility"
    },
    "culturalFit": {
      "workStyleMatch": "assessment of work style alignment",
      "teamFitIndicators": ["soft skills that indicate good team fit"]
    },
    "overallFit": "detailed paragraph assessment of candidate-job compatibility",
    "strengths": ["top 3-5 reasons this candidate excels for this role"],
    "concerns": ["top 3-5 potential challenges or skill gaps"],
    "recommendations": ["specific suggestions for interview focus or skill development"]
  },
  "riskAssessment": {
    "flightRisk": "LOW/MEDIUM/HIGH - likelihood candidate will leave soon",
    "overqualified": "boolean - is candidate overqualified for this role",
    "underqualified": "boolean - is candidate underqualified"
  }
}

MATCHING ANALYSIS CRITERIA:
1. TECHNICAL SKILLS: Exact match on programming languages, frameworks, tools
2. EXPERIENCE LEVEL: Years of experience vs job level requirements  
3. INDUSTRY BACKGROUND: Relevant domain experience
4. ROLE PROGRESSION: Career trajectory alignment with job level
5. EDUCATION: Degree requirements vs candidate education
6. CERTIFICATIONS: Required certs vs candidate certifications
7. SOFT SKILLS: Communication, leadership, teamwork alignment
8. COMPENSATION: Salary expectations vs job offer range
9. LOCATION/REMOTE: Geographic and work arrangement preferences
10. GROWTH POTENTIAL: Learning capacity and career advancement fit

SCORING GUIDELINES:
- 0.9-1.0: Exceptional match, ideal candidate
- 0.8-0.89: Strong match, highly recommended  
- 0.7-0.79: Good match, worth interviewing
- 0.6-0.69: Moderate match, has potential
- 0.5-0.59: Weak match, significant gaps
- 0.0-0.49: Poor match, not recommended

Be thorough, specific, and data-driven in your analysis.
Be thorough, specific, and data-driven in your analysis.
`;
  }

  private createJobDescriptionPrompt(
    jobTitle: string,
    company: string,
    requirements: string[],
    benefits?: string[],
  ): string {
    return `
Create a compelling job description for:

Job Title: ${jobTitle}
Company: ${company}
Requirements: ${requirements.join(', ')}
Benefits: ${benefits?.join(', ') || 'Standard benefits package'}

Structure the job description with:
1. Company overview (brief, engaging)
2. Role summary
3. Key responsibilities (5-7 bullets)
4. Required qualifications
5. Preferred qualifications
6. Benefits and perks
7. Application instructions

Make it professional, engaging, and clear. Use action-oriented language and highlight growth opportunities.
`;
  }

  private validateAndCleanParsedData(data: any): ParsedResumeData {
    // Basic validation and cleanup
    const cleaned: ParsedResumeData = {
      personalInfo: {
        firstName: data.personalInfo?.firstName || '',
        lastName: data.personalInfo?.lastName || '',
        email: data.personalInfo?.email || '',
        phone: data.personalInfo?.phone || undefined,
        location: data.personalInfo?.location || undefined,
        linkedin: data.personalInfo?.linkedin || undefined,
        github: data.personalInfo?.github || undefined,
        portfolio: data.personalInfo?.portfolio || undefined,
      },
      professionalSummary: data.professionalSummary || undefined,
      experience: Array.isArray(data.experience) ? data.experience : [],
      education: Array.isArray(data.education) ? data.education : [],
      skills: {
        technical: Array.isArray(data.skills?.technical)
          ? data.skills.technical
          : [],
        soft: Array.isArray(data.skills?.soft) ? data.skills.soft : [],
        languages: Array.isArray(data.skills?.languages)
          ? data.skills.languages
          : undefined,
      },
      certifications: Array.isArray(data.certifications)
        ? data.certifications
        : undefined,
      projects: Array.isArray(data.projects) ? data.projects : undefined,
      metadata: {
        totalExperience: Number(data.metadata?.totalExperience) || 0,
        currentRole: data.metadata?.currentRole || undefined,
        industryExperience: Array.isArray(data.metadata?.industryExperience)
          ? data.metadata.industryExperience
          : undefined,
        salaryExpectation: data.metadata?.salaryExpectation || undefined,
      },
    };

    return cleaned;
  }

  async parseJobDescription(jobText: string): Promise<ParsedJobData> {
    try {
      const prompt = this.createJobParsingPrompt(jobText);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert job description parser. Extract structured data from job descriptions and return it as valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      console.log(
        'OpenAI job parsing response:',
        response.choices[0].message.content,
      );

      const parsedData = JSON.parse(
        response.choices[0].message.content || '{}',
      );
      return this.validateAndCleanJobData(parsedData);
    } catch (error) {
      this.logger.error('Error parsing job description with OpenAI:', error);
      throw new Error('Failed to parse job description');
    }
  }

  private createJobParsingPrompt(jobText: string): string {
    return `
You are an expert job description parser that extracts structured data for AI-powered candidate matching.

Parse the following job description and return structured JSON data that will be used to match candidates with jobs. The output format is designed to align with candidate profile data for optimal matching algorithms.

CRITICAL: Return only valid JSON with this exact structure:

{
  "jobInfo": {
    "title": "exact job title",
    "company": "company name", 
    "department": "department if mentioned",
    "location": "location if mentioned",
    "remote": true/false,
    "type": "FULL_TIME/PART_TIME/CONTRACT/FREELANCE/INTERNSHIP",
    "level": "ENTRY/JUNIOR/MID/SENIOR/LEAD/PRINCIPAL/EXECUTIVE"
  },
  "description": "comprehensive job overview and company context",
  "requirements": {
    "mandatory": ["required qualifications - be specific and detailed"],
    "preferred": ["nice-to-have qualifications"],
    "experience": {
      "years": number,
      "level": "detailed experience level description"
    },
    "education": ["education requirements"],
    "skills": {
      "technical": ["specific technical skills, programming languages, frameworks, tools"],
      "soft": ["communication, leadership, teamwork, etc."]
    },
    "certifications": ["required certifications and licenses"]
  },
  "responsibilities": ["detailed list of key job responsibilities and duties"],
  "benefits": {
    "salary": {
      "min": number or null,
      "max": number or null,
      "currency": "USD"
    },
    "benefits": ["health insurance, 401k, vacation, etc."],
    "workSchedule": "schedule details and flexibility",
    "paidTimeOff": "PTO, vacation days, sick leave details"
  },
  "applicationInfo": {
    "deadline": "application deadline in YYYY-MM-DD format",
    "contactInfo": {
      "email": "contact email",
      "phone": "contact phone", 
      "contact": "hiring manager or contact person"
    },
    "applicationProcess": "how to apply and what to include"
  },
  "metadata": {
    "urgency": "LOW/MEDIUM/HIGH/URGENT",
    "startDate": "start date if mentioned",
    "industry": "specific industry vertical",
    "teamSize": "team size or department size"
  }
}

Job Description:
${jobText}

MATCHING OPTIMIZATION INSTRUCTIONS:
- Extract skills with maximum granularity (React vs JavaScript, AWS vs Cloud)
- Include both explicit and implicit requirements
- Capture experience level nuances (junior vs 2-3 years)
- Map soft skills mentioned in job culture/environment descriptions
- Include industry context for better candidate-job matching
- Be specific with technical requirements for accurate skill matching
- Extract compensation details completely for candidate salary matching
- Identify remote/location preferences for geographic matching

VALIDATION RULES:
- Return only valid JSON (no markdown, no explanations)
- Use null for missing numeric values, empty arrays for missing lists
- Map job types/levels to exact enum values provided
- Split technical and soft skills precisely
- Include all mentioned responsibilities for role clarity
- Extract complete benefits package for candidate attraction
`;
  }

  private validateAndCleanJobData(data: any): ParsedJobData {
    const cleaned: ParsedJobData = {
      jobInfo: {
        title: data.jobInfo?.title || 'Untitled Position',
        company: data.jobInfo?.company || 'Unknown Company',
        department: data.jobInfo?.department || undefined,
        location: data.jobInfo?.location || undefined,
        remote: Boolean(data.jobInfo?.remote),
        type: data.jobInfo?.type || undefined,
        level: data.jobInfo?.level || undefined,
      },
      description: data.description || '',
      requirements: {
        mandatory: Array.isArray(data.requirements?.mandatory)
          ? data.requirements.mandatory
          : [],
        preferred: Array.isArray(data.requirements?.preferred)
          ? data.requirements.preferred
          : undefined,
        experience: data.requirements?.experience || undefined,
        education: Array.isArray(data.requirements?.education)
          ? data.requirements.education
          : undefined,
        skills: {
          technical: Array.isArray(data.requirements?.skills?.technical)
            ? data.requirements.skills.technical
            : [],
          soft: Array.isArray(data.requirements?.skills?.soft)
            ? data.requirements.skills.soft
            : [],
        },
        certifications: Array.isArray(data.requirements?.certifications)
          ? data.requirements.certifications
          : undefined,
      },
      responsibilities: Array.isArray(data.responsibilities)
        ? data.responsibilities
        : [],
      benefits: data.benefits || undefined,
      applicationInfo: data.applicationInfo || undefined,
      metadata: {
        urgency: data.metadata?.urgency || undefined,
        startDate: data.metadata?.startDate || undefined,
        industry: data.metadata?.industry || undefined,
        teamSize: data.metadata?.teamSize || undefined,
      },
    };

    return cleaned;
  }

  // Embedding-based matching methods
  async generateCandidateEmbedding(candidateData: any): Promise<number[]> {
    try {
      const candidateText = this.createCandidateEmbeddingText(candidateData);
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: candidateText,
        encoding_format: 'float',
      });

      return response.data[0].embedding;
    } catch (error) {
      this.logger.error('Error generating candidate embedding:', error);
      throw new Error('Failed to generate candidate embedding');
    }
  }

  async generateJobEmbedding(jobData: any): Promise<number[]> {
    try {
      const jobText = this.createJobEmbeddingText(jobData);
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: jobText,
        encoding_format: 'float',
      });

      return response.data[0].embedding;
    } catch (error) {
      this.logger.error('Error generating job embedding:', error);
      throw new Error('Failed to generate job embedding');
    }
  }

  calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  private createCandidateEmbeddingText(candidate: any): string {
    const parts: string[] = [];

    // Basic info
    if (candidate.firstName && candidate.lastName) {
      parts.push(`Name: ${candidate.firstName} ${candidate.lastName}`);
    }

    // Current role and experience
    if (candidate.currentRole) {
      parts.push(`Current Role: ${candidate.currentRole}`);
    }
    if (candidate.yearsOfExperience) {
      parts.push(`Years of Experience: ${candidate.yearsOfExperience}`);
    }

    // Skills
    if (candidate.skills) {
      if (
        candidate.skills.technical &&
        Array.isArray(candidate.skills.technical)
      ) {
        parts.push(
          `Technical Skills: ${candidate.skills.technical.join(', ')}`,
        );
      }
      if (candidate.skills.soft && Array.isArray(candidate.skills.soft)) {
        parts.push(`Soft Skills: ${candidate.skills.soft.join(', ')}`);
      }
    }

    // Experience
    if (candidate.experience && Array.isArray(candidate.experience)) {
      const experienceText = candidate.experience
        .map((exp: any) => {
          const expParts: string[] = [];
          if (exp.title) expParts.push(`Title: ${exp.title}`);
          if (exp.company) expParts.push(`Company: ${exp.company}`);
          if (exp.description) expParts.push(`Description: ${exp.description}`);
          if (exp.technologies && Array.isArray(exp.technologies)) {
            expParts.push(`Technologies: ${exp.technologies.join(', ')}`);
          }
          return expParts.join(' | ');
        })
        .join('\n');
      parts.push(`Experience:\n${experienceText}`);
    }

    // Education
    if (candidate.education && Array.isArray(candidate.education)) {
      const educationText = candidate.education
        .map((edu: any) => {
          const eduParts: string[] = [];
          if (edu.degree) eduParts.push(edu.degree);
          if (edu.institution) eduParts.push(edu.institution);
          return eduParts.join(' from ');
        })
        .join(', ');
      parts.push(`Education: ${educationText}`);
    }

    // Industry experience
    if (
      candidate.industryExperience &&
      Array.isArray(candidate.industryExperience)
    ) {
      parts.push(
        `Industry Experience: ${candidate.industryExperience.join(', ')}`,
      );
    }

    // Location
    if (candidate.location) {
      parts.push(`Location: ${candidate.location}`);
    }

    return parts.join('\n');
  }

  private createJobEmbeddingText(job: any): string {
    const parts: string[] = [];

    // Basic job info
    if (job.title) {
      parts.push(`Job Title: ${job.title}`);
    }

    if (job.description) {
      parts.push(`Description: ${job.description}`);
    }

    // Job details
    if (job.department) {
      parts.push(`Department: ${job.department}`);
    }
    if (job.location) {
      parts.push(`Location: ${job.location}`);
    }
    if (job.type) {
      parts.push(`Job Type: ${job.type}`);
    }
    if (job.level) {
      parts.push(`Level: ${job.level}`);
    }

    // Requirements
    if (job.requirements) {
      parts.push(`Requirements: ${job.requirements}`);
    }

    // Structured data from AI parsing
    if (job.requirementsDetailed) {
      const req = job.requirementsDetailed;
      if (req.mandatory && Array.isArray(req.mandatory)) {
        parts.push(`Mandatory Requirements: ${req.mandatory.join(', ')}`);
      }
      if (req.preferred && Array.isArray(req.preferred)) {
        parts.push(`Preferred Requirements: ${req.preferred.join(', ')}`);
      }
      if (req.skills?.technical && Array.isArray(req.skills.technical)) {
        parts.push(
          `Required Technical Skills: ${req.skills.technical.join(', ')}`,
        );
      }
      if (req.skills?.soft && Array.isArray(req.skills.soft)) {
        parts.push(`Required Soft Skills: ${req.skills.soft.join(', ')}`);
      }
      if (req.experience?.years) {
        parts.push(`Required Experience: ${req.experience.years} years`);
      }
      if (req.education && Array.isArray(req.education)) {
        parts.push(`Education Requirements: ${req.education.join(', ')}`);
      }
    }

    // Responsibilities
    if (job.responsibilities && Array.isArray(job.responsibilities)) {
      parts.push(`Responsibilities: ${job.responsibilities.join(', ')}`);
    }

    // Benefits and compensation
    if (job.salaryMin && job.salaryMax) {
      parts.push(
        `Salary Range: ${job.salaryMin} - ${job.salaryMax} ${job.currency || 'USD'}`,
      );
    }

    if (job.benefits?.benefits && Array.isArray(job.benefits.benefits)) {
      parts.push(`Benefits: ${job.benefits.benefits.join(', ')}`);
    }

    // Company info
    if (job.company?.name) {
      parts.push(`Company: ${job.company.name}`);
    }

    return parts.join('\n');
  }
}
