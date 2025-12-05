/*
  Warnings:

  - You are about to drop the `time_slots` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "time_slots";

-- CreateTable
CREATE TABLE "device_sessions" (
    "session_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "device_id" TEXT NOT NULL,
    "device_name" TEXT,
    "device_type" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "login_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logout_at" TIMESTAMP(3),

    CONSTRAINT "device_sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateTable
CREATE TABLE "timeslots" (
    "timeslot_id" SERIAL NOT NULL,
    "time" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'IST',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timeslots_pkey" PRIMARY KEY ("timeslot_id")
);

-- CreateIndex
CREATE INDEX "device_sessions_user_id_idx" ON "device_sessions"("user_id");

-- CreateIndex
CREATE INDEX "device_sessions_device_id_idx" ON "device_sessions"("device_id");

-- CreateIndex
CREATE INDEX "device_sessions_is_active_idx" ON "device_sessions"("is_active");

-- AddForeignKey
ALTER TABLE "device_sessions" ADD CONSTRAINT "device_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
