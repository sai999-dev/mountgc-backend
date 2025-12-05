-- CreateTable
CREATE TABLE "research_paper_configs" (
    "config_id" SERIAL NOT NULL,
    "currency" TEXT NOT NULL,
    "co_authors" INTEGER NOT NULL,
    "actual_price" DOUBLE PRECISION NOT NULL,
    "discounted_price" DOUBLE PRECISION NOT NULL,
    "discount_percent" DOUBLE PRECISION NOT NULL DEFAULT 20.0,
    "duration_weeks" TEXT NOT NULL DEFAULT '3-4 weeks',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_paper_configs_pkey" PRIMARY KEY ("config_id")
);

-- CreateTable
CREATE TABLE "research_paper_purchases" (
    "purchase_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "currency" TEXT NOT NULL,
    "co_authors" INTEGER NOT NULL,
    "actual_amount" DOUBLE PRECISION NOT NULL,
    "discount_amount" DOUBLE PRECISION NOT NULL,
    "final_amount" DOUBLE PRECISION NOT NULL,
    "duration" TEXT NOT NULL,
    "payment_status" TEXT NOT NULL DEFAULT 'pending',
    "payment_id" TEXT,
    "payment_method" TEXT,
    "research_group" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'initiated',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_paper_purchases_pkey" PRIMARY KEY ("purchase_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "research_paper_configs_currency_co_authors_key" ON "research_paper_configs"("currency", "co_authors");

-- CreateIndex
CREATE INDEX "research_paper_purchases_user_id_idx" ON "research_paper_purchases"("user_id");

-- CreateIndex
CREATE INDEX "research_paper_purchases_payment_status_idx" ON "research_paper_purchases"("payment_status");

-- CreateIndex
CREATE INDEX "research_paper_purchases_status_idx" ON "research_paper_purchases"("status");

-- AddForeignKey
ALTER TABLE "research_paper_purchases" ADD CONSTRAINT "research_paper_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
