-- AlterTable
ALTER TABLE "research_paper_purchases" ADD COLUMN     "admin_notes" TEXT,
ADD COLUMN     "case_status" TEXT NOT NULL DEFAULT 'open';

-- CreateIndex
CREATE INDEX "research_paper_purchases_case_status_idx" ON "research_paper_purchases"("case_status");
