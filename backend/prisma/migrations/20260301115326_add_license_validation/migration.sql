-- CreateTable
CREATE TABLE "valid_driver_licenses" (
    "id" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "licenseType" TEXT NOT NULL,
    "bloodGroup" TEXT,
    "address" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "valid_driver_licenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "valid_driver_licenses_licenseNumber_key" ON "valid_driver_licenses"("licenseNumber");

-- CreateIndex
CREATE INDEX "valid_driver_licenses_licenseNumber_idx" ON "valid_driver_licenses"("licenseNumber");

-- CreateIndex
CREATE INDEX "valid_driver_licenses_expiryDate_idx" ON "valid_driver_licenses"("expiryDate");
