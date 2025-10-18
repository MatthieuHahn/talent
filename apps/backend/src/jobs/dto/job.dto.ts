import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsDateString,
  IsArray,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JobType, JobLevel, JobStatus, Priority } from '@talent/types';

export interface ParsedJobData {
  jobInfo: {
    title: string;
    company: string;
    department?: string;
    location?: string;
    remote: boolean;
    type?: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'FREELANCE' | 'INTERNSHIP';
    level?:
      | 'ENTRY'
      | 'JUNIOR'
      | 'MID'
      | 'SENIOR'
      | 'LEAD'
      | 'PRINCIPAL'
      | 'EXECUTIVE';
  };
  description: string;
  requirements: {
    mandatory: string[];
    preferred?: string[];
    experience?: {
      years: number;
      level: string;
    };
    education?: string[];
    skills: {
      technical: string[];
      soft: string[];
    };
    certifications?: string[];
  };
  responsibilities: string[];
  benefits?: {
    salary?: {
      min?: number | null;
      max?: number | null;
      currency: string;
    };
    benefits: string[];
    workSchedule?: string;
    paidTimeOff?: string;
  };
  applicationInfo?: {
    deadline?: string; // YYYY-MM-DD format
    contactInfo?: {
      email?: string;
      phone?: string;
      contact?: string;
    };
    applicationProcess?: string;
  };
  metadata: {
    urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    startDate?: string;
    industry?: string;
    teamSize?: string;
  };
}

export class CreateJobDto {
  @IsOptional()
  @IsString()
  jobDescriptionUrl?: string;
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  requirements?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsBoolean()
  remote?: boolean = false;

  @IsOptional()
  @IsEnum(JobType)
  type?: JobType = JobType.FULL_TIME;

  @IsOptional()
  @IsEnum(JobLevel)
  level?: JobLevel = JobLevel.MID;

  @IsOptional()
  @IsNumber()
  salaryMin?: number;

  @IsOptional()
  @IsNumber()
  salaryMax?: number;

  @IsOptional()
  @IsString()
  currency?: string = 'USD';

  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus = JobStatus.DRAFT;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority = Priority.MEDIUM;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsString()
  companyId?: string;

  // Structured data from OpenAI parsing - matches the prompt structure exactly
  @IsOptional()
  @IsObject()
  jobInfo?: any; // Complete job info object: title, company, department, location, remote, type, level

  @IsOptional()
  @IsObject()
  requirementsDetailed?: any; // Detailed requirements object

  @IsOptional()
  @IsObject()
  responsibilities?: any; // Array of job responsibilities

  @IsOptional()
  @IsObject()
  benefits?: any; // Benefits object

  @IsOptional()
  @IsObject()
  applicationInfo?: any; // Application details

  @IsOptional()
  @IsObject()
  metadata?: any; // Additional metadata
}

export class CreateJobWithAIDto {
  @IsString()
  title: string;

  @IsString()
  company: string;

  @IsArray()
  @IsString({ each: true })
  requirements: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benefits?: string[];

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsBoolean()
  remote?: boolean = false;

  @IsOptional()
  @IsEnum(JobType)
  type?: JobType = JobType.FULL_TIME;

  @IsOptional()
  @IsEnum(JobLevel)
  level?: JobLevel = JobLevel.MID;

  @IsOptional()
  @IsNumber()
  salaryMin?: number;

  @IsOptional()
  @IsNumber()
  salaryMax?: number;

  @IsOptional()
  @IsString()
  currency?: string = 'USD';

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority = Priority.MEDIUM;

  @IsOptional()
  @IsDateString()
  deadline?: string;
}

export class UpdateJobDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  requirements?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsBoolean()
  remote?: boolean;

  @IsOptional()
  @IsEnum(JobType)
  type?: JobType;

  @IsOptional()
  @IsEnum(JobLevel)
  level?: JobLevel;

  @IsOptional()
  @IsNumber()
  salaryMin?: number;

  @IsOptional()
  @IsNumber()
  salaryMax?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  // Structured data from OpenAI parsing - matches the prompt structure exactly
  @IsOptional()
  @IsObject()
  jobInfo?: any; // Complete job info object: title, company, department, location, remote, type, level

  @IsOptional()
  @IsObject()
  requirementsDetailed?: any; // Detailed requirements object

  @IsOptional()
  @IsObject()
  responsibilities?: any; // Array of job responsibilities

  @IsOptional()
  @IsObject()
  benefits?: any; // Benefits object

  @IsOptional()
  @IsObject()
  applicationInfo?: any; // Application details

  @IsOptional()
  @IsObject()
  metadata?: any; // Additional metadata
}

export class CreateJobFromFileDto {
  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsBoolean()
  remote?: boolean = false;

  @IsOptional()
  @IsEnum(JobType)
  type?: JobType = JobType.FULL_TIME;

  @IsOptional()
  @IsEnum(JobLevel)
  level?: JobLevel = JobLevel.MID;

  @IsOptional()
  @IsNumber()
  salaryMin?: number;

  @IsOptional()
  @IsNumber()
  salaryMax?: number;

  @IsOptional()
  @IsString()
  currency?: string = 'USD';

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority = Priority.MEDIUM;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsString()
  source?: string = 'file_upload';

  @IsOptional()
  @IsString()
  notes?: string;

  // This will be populated by the AI parsing
  @IsObject()
  @IsOptional()
  parsedData?: ParsedJobData;
}

export class JobQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(JobStatus)
  status?: JobStatus;

  @IsOptional()
  @IsEnum(JobType)
  type?: JobType;

  @IsOptional()
  @IsEnum(JobLevel)
  level?: JobLevel;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsBoolean()
  remote?: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
