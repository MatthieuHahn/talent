import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsNumber,
  IsDateString,
  IsUrl,
  Min,
  Max,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum CandidateStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED',
  BLACKLISTED = 'BLACKLISTED',
}

// AI-parsed resume structure
export interface ParsedResumeData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  professionalSummary?: string;
  experience: Array<{
    title: string;
    company: string;
    startDate: string;
    endDate?: string;
    description: string;
    technologies?: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    graduationDate?: string;
    gpa?: string;
  }>;
  skills: {
    technical: string[];
    soft: string[];
    languages?: Array<{
      language: string;
      proficiency: string;
    }>;
  };
  certifications?: Array<{
    name: string;
    issuer: string;
    date?: string;
  }>;
  projects?: Array<{
    name: string;
    description: string;
    technologies?: string[];
    url?: string;
  }>;
  metadata: {
    totalExperience: number; // in years
    currentRole?: string;
    industryExperience?: string[];
    salaryExpectation?: {
      min?: number;
      max?: number;
      currency?: string;
    };
  };
}

export class CreateCandidateFromResumeDto {
  @IsString()
  @IsOptional()
  source?: string = 'resume_upload';

  @IsString()
  @IsOptional()
  notes?: string;

  @IsEnum(CandidateStatus)
  @IsOptional()
  status?: CandidateStatus = CandidateStatus.ACTIVE;

  @IsString()
  @IsOptional()
  companyId?: string;

  // This will be populated by the AI parsing
  @IsObject()
  @IsOptional()
  parsedData?: ParsedResumeData;
}

export class CreateCandidateDto {
  @IsEmail()
  email: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsUrl()
  @IsOptional()
  linkedin?: string;

  @IsUrl()
  @IsOptional()
  github?: string;

  @IsUrl()
  @IsOptional()
  portfolio?: string;

  @IsString()
  @IsOptional()
  resume?: string; // File path or URL

  @IsString()
  @IsOptional()
  summary?: string;

  @IsEnum(CandidateStatus)
  @IsOptional()
  status?: CandidateStatus = CandidateStatus.ACTIVE;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(50)
  @Type(() => Number)
  yearsOfExperience?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  currentSalary?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  expectedSalary?: number;

  @IsDateString()
  @IsOptional()
  availability?: string;

  @IsString()
  @IsOptional()
  source?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  companyId?: string;

  // AI-related fields
  @IsObject()
  @IsOptional()
  aiData?: {
    parsedResume?: ParsedResumeData;
    skillsExtracted?: string[];
    experienceLevel?: 'junior' | 'mid' | 'senior' | 'lead' | 'executive';
    industryMatch?: string[];
  };
}

export class UpdateCandidateDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsUrl()
  @IsOptional()
  linkedin?: string;

  @IsUrl()
  @IsOptional()
  github?: string;

  @IsUrl()
  @IsOptional()
  portfolio?: string;

  @IsString()
  @IsOptional()
  resume?: string;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsEnum(CandidateStatus)
  @IsOptional()
  status?: CandidateStatus;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  timezone?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(50)
  @Type(() => Number)
  yearsOfExperience?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  currentSalary?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  expectedSalary?: number;

  @IsDateString()
  @IsOptional()
  availability?: string;

  @IsString()
  @IsOptional()
  source?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  companyId?: string;

  @IsObject()
  @IsOptional()
  aiData?: object;
}

export class CandidateQueryDto {
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(CandidateStatus)
  @IsOptional()
  status?: CandidateStatus;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  skills?: string; // Comma-separated skills

  @IsString()
  @IsOptional()
  experience?: string; // junior,mid,senior,lead,executive

  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class MatchCandidatesDto {
  @IsString()
  jobId: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number = 10;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  @Type(() => Number)
  minMatchScore?: number = 0.7;
}
