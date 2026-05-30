-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'COMPLETED');

-- CreateTable
CREATE TABLE "bus_assignments" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "departureTime" TEXT NOT NULL,
    "days" TEXT[],
    "status" "AssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bus_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bus_assignments_organizationId_idx" ON "bus_assignments"("organizationId");

-- CreateIndex
CREATE INDEX "bus_assignments_vehicleId_idx" ON "bus_assignments"("vehicleId");

-- CreateIndex
CREATE INDEX "bus_assignments_driverId_idx" ON "bus_assignments"("driverId");

-- CreateIndex
CREATE INDEX "bus_assignments_routeId_idx" ON "bus_assignments"("routeId");

-- AddForeignKey
ALTER TABLE "bus_assignments" ADD CONSTRAINT "bus_assignments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bus_assignments" ADD CONSTRAINT "bus_assignments_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bus_assignments" ADD CONSTRAINT "bus_assignments_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bus_assignments" ADD CONSTRAINT "bus_assignments_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
