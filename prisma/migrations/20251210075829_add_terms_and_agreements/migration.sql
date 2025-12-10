-- CreateTable
CREATE TABLE "terms_and_conditions" (
    "terms_id" SERIAL NOT NULL,
    "service_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "terms_and_conditions_pkey" PRIMARY KEY ("terms_id")
);

-- CreateTable
CREATE TABLE "user_agreements" (
    "agreement_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "terms_id" INTEGER NOT NULL,
    "service_type" TEXT NOT NULL,
    "signed_name" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "agreed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_agreements_pkey" PRIMARY KEY ("agreement_id")
);

-- CreateIndex
CREATE INDEX "terms_and_conditions_service_type_idx" ON "terms_and_conditions"("service_type");

-- CreateIndex
CREATE INDEX "terms_and_conditions_is_active_idx" ON "terms_and_conditions"("is_active");

-- CreateIndex
CREATE INDEX "user_agreements_user_id_idx" ON "user_agreements"("user_id");

-- CreateIndex
CREATE INDEX "user_agreements_service_type_idx" ON "user_agreements"("service_type");

-- CreateIndex
CREATE INDEX "user_agreements_terms_id_idx" ON "user_agreements"("terms_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_agreements_user_id_service_type_key" ON "user_agreements"("user_id", "service_type");

-- AddForeignKey
ALTER TABLE "user_agreements" ADD CONSTRAINT "user_agreements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_agreements" ADD CONSTRAINT "user_agreements_terms_id_fkey" FOREIGN KEY ("terms_id") REFERENCES "terms_and_conditions"("terms_id") ON DELETE RESTRICT ON UPDATE CASCADE;
