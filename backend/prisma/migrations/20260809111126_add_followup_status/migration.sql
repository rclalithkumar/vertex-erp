-- CreateEnum
CREATE TYPE "FollowUpStatus" AS ENUM ('PENDING', 'COMPLETED');

-- AlterTable
ALTER TABLE "FollowUp" ADD COLUMN     "status" "FollowUpStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "FollowUp_status_idx" ON "FollowUp"("status");

-- CreateIndex
CREATE INDEX "FollowUp_followUpAt_idx" ON "FollowUp"("followUpAt");
