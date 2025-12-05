-- CreateTable
CREATE TABLE "transactions" (
    "transaction_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "service_type" TEXT NOT NULL,
    "service_id" INTEGER,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "payment_gateway" TEXT NOT NULL DEFAULT 'stripe',
    "payment_status" TEXT NOT NULL DEFAULT 'pending',
    "payment_method" TEXT,
    "stripe_session_id" TEXT,
    "stripe_payment_intent_id" TEXT,
    "stripe_customer_id" TEXT,
    "stripe_charge_id" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "paid_at" TIMESTAMP(3),
    "refunded_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "error_message" TEXT,
    "error_code" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("transaction_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transactions_service_id_key" ON "transactions"("service_id");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_stripe_session_id_key" ON "transactions"("stripe_session_id");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_stripe_payment_intent_id_key" ON "transactions"("stripe_payment_intent_id");

-- CreateIndex
CREATE INDEX "transactions_user_id_idx" ON "transactions"("user_id");

-- CreateIndex
CREATE INDEX "transactions_service_type_idx" ON "transactions"("service_type");

-- CreateIndex
CREATE INDEX "transactions_service_id_idx" ON "transactions"("service_id");

-- CreateIndex
CREATE INDEX "transactions_payment_status_idx" ON "transactions"("payment_status");

-- CreateIndex
CREATE INDEX "transactions_stripe_session_id_idx" ON "transactions"("stripe_session_id");

-- CreateIndex
CREATE INDEX "transactions_stripe_payment_intent_id_idx" ON "transactions"("stripe_payment_intent_id");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "research_paper_purchases"("purchase_id") ON DELETE SET NULL ON UPDATE CASCADE;
