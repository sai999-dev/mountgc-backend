-- CreateTable
CREATE TABLE "counselling_service_types" (
    "service_type_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "duration" TEXT NOT NULL DEFAULT '1 hour',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "counselling_service_types_pkey" PRIMARY KEY ("service_type_id")
);

-- CreateTable
CREATE TABLE "counselors" (
    "counselor_id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "email" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "counselors_pkey" PRIMARY KEY ("counselor_id")
);

-- CreateTable
CREATE TABLE "counselling_pricing_configs" (
    "config_id" SERIAL NOT NULL,
    "service_type_id" INTEGER NOT NULL,
    "counselor_id" INTEGER,
    "currency" TEXT NOT NULL,
    "actual_price" DOUBLE PRECISION NOT NULL,
    "discounted_price" DOUBLE PRECISION NOT NULL,
    "discount_percent" DOUBLE PRECISION NOT NULL DEFAULT 20.0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "counselling_pricing_configs_pkey" PRIMARY KEY ("config_id")
);

-- CreateTable
CREATE TABLE "counselling_purchases" (
    "purchase_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "service_type_id" INTEGER NOT NULL,
    "counselor_id" INTEGER,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "actual_amount" DOUBLE PRECISION NOT NULL,
    "discount_amount" DOUBLE PRECISION NOT NULL,
    "final_amount" DOUBLE PRECISION NOT NULL,
    "duration" TEXT NOT NULL,
    "scheduled_date" TIMESTAMP(3),
    "scheduled_time" TEXT,
    "meeting_link" TEXT,
    "payment_status" TEXT NOT NULL DEFAULT 'pending',
    "payment_id" TEXT,
    "payment_method" TEXT,
    "notes" TEXT,
    "admin_notes" TEXT,
    "case_status" TEXT NOT NULL DEFAULT 'open',
    "status" TEXT NOT NULL DEFAULT 'initiated',
    "order_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "counselling_purchases_pkey" PRIMARY KEY ("purchase_id")
);

-- CreateIndex
CREATE INDEX "counselling_pricing_configs_service_type_id_idx" ON "counselling_pricing_configs"("service_type_id");

-- CreateIndex
CREATE INDEX "counselling_pricing_configs_counselor_id_idx" ON "counselling_pricing_configs"("counselor_id");

-- CreateIndex
CREATE INDEX "counselling_pricing_configs_currency_idx" ON "counselling_pricing_configs"("currency");

-- CreateIndex
CREATE UNIQUE INDEX "counselling_pricing_configs_service_type_id_counselor_id_cu_key" ON "counselling_pricing_configs"("service_type_id", "counselor_id", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "counselling_purchases_order_id_key" ON "counselling_purchases"("order_id");

-- CreateIndex
CREATE INDEX "counselling_purchases_user_id_idx" ON "counselling_purchases"("user_id");

-- CreateIndex
CREATE INDEX "counselling_purchases_service_type_id_idx" ON "counselling_purchases"("service_type_id");

-- CreateIndex
CREATE INDEX "counselling_purchases_counselor_id_idx" ON "counselling_purchases"("counselor_id");

-- CreateIndex
CREATE INDEX "counselling_purchases_payment_status_idx" ON "counselling_purchases"("payment_status");

-- CreateIndex
CREATE INDEX "counselling_purchases_status_idx" ON "counselling_purchases"("status");

-- CreateIndex
CREATE INDEX "counselling_purchases_case_status_idx" ON "counselling_purchases"("case_status");

-- AddForeignKey
ALTER TABLE "counselling_pricing_configs" ADD CONSTRAINT "counselling_pricing_configs_service_type_id_fkey" FOREIGN KEY ("service_type_id") REFERENCES "counselling_service_types"("service_type_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counselling_pricing_configs" ADD CONSTRAINT "counselling_pricing_configs_counselor_id_fkey" FOREIGN KEY ("counselor_id") REFERENCES "counselors"("counselor_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counselling_purchases" ADD CONSTRAINT "counselling_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counselling_purchases" ADD CONSTRAINT "counselling_purchases_service_type_id_fkey" FOREIGN KEY ("service_type_id") REFERENCES "counselling_service_types"("service_type_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "counselling_purchases" ADD CONSTRAINT "counselling_purchases_counselor_id_fkey" FOREIGN KEY ("counselor_id") REFERENCES "counselors"("counselor_id") ON DELETE SET NULL ON UPDATE CASCADE;
