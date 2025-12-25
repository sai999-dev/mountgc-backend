/*
  Warnings:

  - Made the column `phone` on table `research_paper_purchases` required. This step will fail if there are existing NULL values in that column.
  - Made the column `phone` on table `visa_application_purchases` required. This step will fail if there are existing NULL values in that column.

*/
-- Update existing NULL phone values to a default value
UPDATE "research_paper_purchases" SET "phone" = 'N/A' WHERE "phone" IS NULL;
UPDATE "visa_application_purchases" SET "phone" = 'N/A' WHERE "phone" IS NULL;

-- AlterTable
ALTER TABLE "research_paper_purchases" ALTER COLUMN "phone" SET NOT NULL;

-- AlterTable
ALTER TABLE "visa_application_purchases" ALTER COLUMN "phone" SET NOT NULL;

-- CreateTable
CREATE TABLE "admin_otp" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "otp_code" VARCHAR(6) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "ip_address" VARCHAR(45),
    "user_agent" TEXT,

    CONSTRAINT "admin_otp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_otp_email_idx" ON "admin_otp"("email");

-- CreateIndex
CREATE INDEX "admin_otp_otp_code_idx" ON "admin_otp"("otp_code");

-- CreateIndex
CREATE INDEX "admin_otp_expires_at_idx" ON "admin_otp"("expires_at");
