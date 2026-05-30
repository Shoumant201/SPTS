-- CreateEnum
CREATE TYPE "IoTDeviceStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'OFFLINE');

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "model" TEXT,
ADD COLUMN     "year" INTEGER;

-- CreateTable
CREATE TABLE "iot_devices" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "deviceToken" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "status" "IoTDeviceStatus" NOT NULL DEFAULT 'INACTIVE',
    "lastSeenAt" TIMESTAMP(3),
    "passengerCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "iot_devices_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "iot_devices_deviceId_key" ON "iot_devices"("deviceId");

-- CreateIndex
CREATE UNIQUE INDEX "iot_devices_deviceToken_key" ON "iot_devices"("deviceToken");

-- CreateIndex
CREATE UNIQUE INDEX "iot_devices_vehicleId_key" ON "iot_devices"("vehicleId");

-- CreateIndex
CREATE INDEX "iot_devices_deviceId_idx" ON "iot_devices"("deviceId");

-- CreateIndex
CREATE INDEX "iot_devices_vehicleId_idx" ON "iot_devices"("vehicleId");

-- AddForeignKey
ALTER TABLE "iot_devices" ADD CONSTRAINT "iot_devices_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
