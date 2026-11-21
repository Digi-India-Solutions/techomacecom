/*
  Warnings:

  - You are about to drop the column `kyc_required` on the `rental_plans` table. All the data in the column will be lost.
  - You are about to drop the column `kyc_reviewed_by` on the `rentals` table. All the data in the column will be lost.
  - You are about to drop the column `kyc_status` on the `rentals` table. All the data in the column will be lost.
  - You are about to drop the `rental_kyc_documents` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "rental_kyc_documents" DROP CONSTRAINT "rental_kyc_documents_rental_id_fkey";

-- DropForeignKey
ALTER TABLE "rentals" DROP CONSTRAINT "rentals_kyc_reviewed_by_fkey";

-- AlterTable
ALTER TABLE "rental_plans" DROP COLUMN "kyc_required";

-- AlterTable
ALTER TABLE "rentals" DROP COLUMN "kyc_reviewed_by",
DROP COLUMN "kyc_status";

-- DropTable
DROP TABLE "rental_kyc_documents";
