// Job types for frontend (matches backend DTO)
export type Job = {
  id: string;
  title: string;
  description: string;
  requirements: string;
  department: string | null;
  location: string | null;
  remote: boolean;
  type: string;
  level: string;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  status: string;
  priority: string;
  startDate: string | null;
  endDate: string | null;
  deadline: string | null;
  companyId: string;
  recruiterId: string;
  aiGenerated: boolean;
  aiPrompt: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  applicationInfo: {
    deadline: string | null;
    contactInfo: {
      email: string | null;
      phone: string | null;
      contact: string | null;
    };
    applicationProcess: string | null;
  };
  benefits: {
    salary: {
      min: number | null;
      max: number | null;
      currency: string;
    };
    benefits: string[];
    paidTimeOff: string | null;
    workSchedule: string | null;
  };
  metadata: {
    urgency: string;
    industry: string;
  };
  requirementsDetailed: {
    skills: {
      soft: string[];
      technical: string[];
    };
    education: string[];
    mandatory: string[];
    preferred: string[];
    experience: {
      level: string;
      years: number;
    };
    certifications: string[];
  };
  responsibilities: string[];
  jobInfo: {
    type: string;
    level: string;
    title: string;
    remote: boolean;
    company: string;
  };
  embedding: string;
  embeddingAt: string;
  embeddingModel: string;
  company: {
    id: string;
    name: string;
  };
  recruiter: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  applications: any[];
  _count: {
    applications: number;
  };
};

export type JobsResponse = {
  jobs: Job[];
  pagination: {
    limit: number;
    page: number;
    pages: number;
    total: number;
  };
};
