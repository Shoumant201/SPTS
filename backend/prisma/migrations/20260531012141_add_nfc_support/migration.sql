-- Add NFC ID field to users table
ALTER TABLE "users" ADD COLUMN "nfcId" TEXT;

-- Create unique index on nfcId
CREATE UNIQUE INDEX "users_nfcId_key" ON "users"("nfcId") WHERE "nfcId" IS NOT NULL;

-- Add comment
COMMENT ON COLUMN "users"."nfcId" IS 'NFC card/phone unique identifier for tap-to-ride';
