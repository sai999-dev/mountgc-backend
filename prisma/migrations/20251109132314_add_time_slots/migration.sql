-- CreateTable
CREATE TABLE "time_slots" (
    "slot_id" SERIAL NOT NULL,
    "time" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "time_slots_pkey" PRIMARY KEY ("slot_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "time_slots_time_key" ON "time_slots"("time");
