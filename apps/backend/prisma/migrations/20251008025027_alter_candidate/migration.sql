-- AlterTable
ALTER TABLE "candidates" ADD COLUMN     "certifications" JSONB,
ADD COLUMN     "currentRole" TEXT,
ADD COLUMN     "education" JSONB,
ADD COLUMN     "experience" JSONB,
ADD COLUMN     "industryExperience" TEXT[],
ADD COLUMN     "projects" JSONB,
ADD COLUMN     "salaryExpectation" JSONB,
ADD COLUMN     "skills" JSONB;
