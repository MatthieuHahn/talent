-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "applicationInfo" JSONB,
ADD COLUMN     "benefits" JSONB,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "requirementsDetailed" JSONB,
ADD COLUMN     "responsibilities" JSONB;
