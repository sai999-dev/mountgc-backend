-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_service_id_fkey";

-- DropIndex
DROP INDEX "transactions_service_id_key";

-- CreateTable
CREATE TABLE "visa_application_configs" (
    "config_id" SERIAL NOT NULL,
    "currency" TEXT NOT NULL,
    "dependents" INTEGER NOT NULL,
    "mocks" INTEGER NOT NULL,
    "actual_price" DOUBLE PRECISION NOT NULL,
    "discounted_price" DOUBLE PRECISION NOT NULL,
    "discount_percent" DOUBLE PRECISION NOT NULL DEFAULT 20.0,
    "duration_months" TEXT NOT NULL DEFAULT '1-2 months',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visa_application_configs_pkey" PRIMARY KEY ("config_id")
);

-- CreateTable
CREATE TABLE "visa_application_purchases" (
    "purchase_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "country" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "dependents" INTEGER NOT NULL,
    "mocks" INTEGER NOT NULL,
    "actual_amount" DOUBLE PRECISION NOT NULL,
    "discount_amount" DOUBLE PRECISION NOT NULL,
    "final_amount" DOUBLE PRECISION NOT NULL,
    "amount_paid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "duration" TEXT NOT NULL,
    "payment_status" TEXT NOT NULL DEFAULT 'pending',
    "visa_guarantee" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "admin_notes" TEXT,
    "case_status" TEXT NOT NULL DEFAULT 'open',
    "status" TEXT NOT NULL DEFAULT 'initiated',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "order_id" TEXT NOT NULL,

    CONSTRAINT "visa_application_purchases_pkey" PRIMARY KEY ("purchase_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "visa_application_configs_currency_dependents_mocks_key" ON "visa_application_configs"("currency", "dependents", "mocks");

-- CreateIndex
CREATE UNIQUE INDEX "visa_application_purchases_order_id_key" ON "visa_application_purchases"("order_id");

-- CreateIndex
CREATE INDEX "visa_application_purchases_user_id_idx" ON "visa_application_purchases"("user_id");

-- CreateIndex
CREATE INDEX "visa_application_purchases_payment_status_idx" ON "visa_application_purchases"("payment_status");

-- CreateIndex
CREATE INDEX "visa_application_purchases_status_idx" ON "visa_application_purchases"("status");

-- CreateIndex
CREATE INDEX "visa_application_purchases_case_status_idx" ON "visa_application_purchases"("case_status");

-- CreateIndex
CREATE INDEX "visa_application_purchases_country_idx" ON "visa_application_purchases"("country");

-- AddForeignKey
ALTER TABLE "visa_application_purchases" ADD CONSTRAINT "visa_application_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
