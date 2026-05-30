-- AlterTable
ALTER TABLE "trips" ADD COLUMN "driverId" TEXT;
ALTER TABLE "trips" ADD COLUMN "assignmentId" TEXT;
ALTER TABLE "trips" ADD COLUMN "startLocation" TEXT;
ALTER TABLE "trips" ADD COLUMN "endLocation" TEXT;
ALTER TABLE "trips" ADD COLUMN "distance" DOUBLE PRECISION;
ALTER TABLE "trips" ADD COLUMN "duration" INTEGER;
ALTER TABLE "trips" ADD COLUMN "driverEarnings" DOUBLE PRECISION;
ALTER TABLE "trips" ADD COLUMN "organizationRevenue" DOUBLE PRECISION;
ALTER TABLE "trips" ADD COLUMN "passengerCount" INTEGER DEFAULT 0;
ALTER TABLE "trips" ADD COLUMN "notes" TEXT;

-- CreateIndex
CREATE INDEX "trips_driverId_idx" ON "trips"("driverId");
CREATE INDEX "trips_assignmentId_idx" ON "trips"("assignmentId");
CREATE INDEX "trips_startTime_idx" ON "trips"("startTime");

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trips" ADD CONSTRAINT "trips_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "bus_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
