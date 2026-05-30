/*
  Warnings:

  - Made the column `passengerCount` on table `trips` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "trips" ALTER COLUMN "passengerCount" SET NOT NULL;
