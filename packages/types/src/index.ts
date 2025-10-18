// Re-export all Prisma generated types
export * from "./generated";

// Export commonly used types with better names
export type { PrismaClient } from "./generated";
export type {
  User,
  Candidate,
  Job,
  Organization,
  Company,
  JobApplication,
  MatchingResult,
  Subscription,
  Payment,
  Invoice,
} from "./generated";

// Export enums
export {
  UserRole,
  CandidateStatus,
  JobType,
  JobLevel,
  JobStatus,
  Priority,
  SubscriptionPlan,
  SubscriptionStatus,
  PaymentStatus,
  ApplicationStatus,
} from "./generated";

// Export input types commonly used in API
import type { Prisma } from "./generated";
export type UserCreateInput = Prisma.UserCreateInput;
export type CandidateCreateInput = Prisma.CandidateCreateInput;
export type JobCreateInput = Prisma.JobCreateInput;
export type OrganizationCreateInput = Prisma.OrganizationCreateInput;
export type CompanyCreateInput = Prisma.CompanyCreateInput;
