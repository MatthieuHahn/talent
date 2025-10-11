/*
  Warnings:

  - You are about to drop the `batch_uploads` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."batch_uploads" DROP CONSTRAINT "batch_uploads_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "public"."batch_uploads" DROP CONSTRAINT "batch_uploads_uploadedById_fkey";

-- DropTable
DROP TABLE "public"."batch_uploads";

-- DropEnum
DROP TYPE "public"."BatchUploadStatus";

-- DropEnum
DROP TYPE "public"."BatchUploadType";
