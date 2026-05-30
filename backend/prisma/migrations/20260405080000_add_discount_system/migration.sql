-- Alter existing DiscountType enum to add new values
-- Note: DiscountType already exists from migration 20251129074248_multi_tier_auth_system
-- We need to add VETERAN and LOW_INCOME, and remove NONE
ALTER TYPE "DiscountType" ADD VALUE IF NOT EXISTS 'VETERAN';
ALTER TYPE "DiscountType" ADD VALUE IF NOT EXISTS 'LOW_INCOME';

-- CreateEnum
CREATE TYPE "DiscountStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'SUSPENDED');

-- CreateTable
CREATE TABLE "DiscountApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "DiscountType" NOT NULL,
    "status" "DiscountStatus" NOT NULL DEFAULT 'PENDING',
    "discountPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "documentUrl" TEXT,
    "documentType" TEXT,
    "idNumber" TEXT,
    "institutionName" TEXT,
    "expiryDate" TIMESTAMP(3),
    "reason" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscountApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DiscountApplication_userId_idx" ON "DiscountApplication"("userId");

-- CreateIndex
CREATE INDEX "DiscountApplication_status_idx" ON "DiscountApplication"("status");

-- CreateIndex
CREATE INDEX "DiscountApplication_type_idx" ON "DiscountApplication"("type");

-- AddForeignKey
ALTER TABLE "DiscountApplication" ADD CONSTRAINT "DiscountApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiscountApplication" ADD CONSTRAINT "DiscountApplication_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
