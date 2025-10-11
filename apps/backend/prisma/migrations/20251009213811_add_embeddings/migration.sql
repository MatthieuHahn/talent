-- AlterTable
ALTER TABLE "candidates" ADD COLUMN     "embedding" TEXT,
ADD COLUMN     "embeddingAt" TIMESTAMP(3),
ADD COLUMN     "embeddingModel" TEXT;

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "embedding" TEXT,
ADD COLUMN     "embeddingAt" TIMESTAMP(3),
ADD COLUMN     "embeddingModel" TEXT;
