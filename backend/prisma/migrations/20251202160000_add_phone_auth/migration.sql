-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('LOGIN', 'REGISTRATION', 'PHONE_VERIFICATION');

-- Step 1: Add new columns as nullable first
ALTER TABLE "users" 
  ADD COLUMN "deviceTokens" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "phoneVerifiedAt" TIMESTAMP(3);

-- Step 2: Update existing users to have phone numbers (generate unique ones)
-- Fixed: Cast to text explicitly for LPAD function
UPDATE "users" 
SET "phone" = '+977' || LPAD(FLOOR(RANDOM() * 9000000000 + 1000000000)::text, 10, '0') 
WHERE "phone" IS NULL;

-- Step 3: Make phone required and unique after all users have phone numbers
ALTER TABLE "users" 
  ALTER COLUMN "phone" SET NOT NULL,
  ADD CONSTRAINT "users_phone_key" UNIQUE ("phone");

-- Step 4: Make email and password optional (for phone auth users)
ALTER TABLE "users" 
  ALTER COLUMN "email" DROP NOT NULL,
  ALTER COLUMN "password" DROP NOT NULL;

-- Step 5: Create OTP codes table
CREATE TABLE "otp_codes" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

-- Step 6: Create indexes for performance
CREATE INDEX "users_phone_idx" ON "users"("phone");
CREATE INDEX "otp_codes_phone_idx" ON "otp_codes"("phone");
CREATE INDEX "otp_codes_code_idx" ON "otp_codes"("code");
CREATE INDEX "otp_codes_expiresAt_idx" ON "otp_codes"("expiresAt");

-- Step 7: Add foreign key constraint
ALTER TABLE "otp_codes" ADD CONSTRAINT "otp_codes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 8: Update existing users to be phone verified (since they have accounts)
UPDATE "users" 
SET "isPhoneVerified" = true, "phoneVerifiedAt" = NOW() 
WHERE "phone" IS NOT NULL;