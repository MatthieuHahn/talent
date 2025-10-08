/*
  Warnings:

  - A unique constraint covering the columns `[email,organizationId]` on the table `candidates` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `organizationId` to the `candidates` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `companies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `jobs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('STARTER', 'PROFESSIONAL', 'ENTERPRISE', 'CUSTOM');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityType" ADD VALUE 'ORGANIZATION_CREATED';
ALTER TYPE "ActivityType" ADD VALUE 'USER_INVITED';

-- DropIndex
DROP INDEX "public"."candidates_email_key";

-- AlterTable
ALTER TABLE "candidates" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "organizationId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brandConfig" JSONB,
    "domain" TEXT,
    "subdomain" TEXT,
    "plan" "SubscriptionPlan" NOT NULL DEFAULT 'STARTER',
    "maxUsers" INTEGER NOT NULL DEFAULT 5,
    "maxJobs" INTEGER NOT NULL DEFAULT 50,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "trialEndsAt" TIMESTAMP(3),
    "contactEmail" TEXT NOT NULL,
    "billingEmail" TEXT,
    "contactPhone" TEXT,
    "billingAddress" JSONB,
    "features" JSONB NOT NULL DEFAULT '{"aiAssisted": true, "customBranding": false, "apiAccess": false}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "candidates_email_organizationId_key" ON "candidates"("email", "organizationId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
