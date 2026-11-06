-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "email" TEXT;

-- CreateIndex
CREATE INDEX "Reservation_date_time_idx" ON "Reservation"("date", "time");
