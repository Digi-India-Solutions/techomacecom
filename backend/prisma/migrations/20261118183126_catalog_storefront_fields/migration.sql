-- AlterTable
ALTER TABLE "brands" ADD COLUMN     "authorized_distributor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "origin_country" VARCHAR(80);

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "certifications" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "features" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "warranty" VARCHAR(200);
