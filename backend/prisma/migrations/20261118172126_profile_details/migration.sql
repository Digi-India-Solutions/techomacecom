-- AlterTable
ALTER TABLE "admin_users" ADD COLUMN     "avatar_url" TEXT;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "qualification" VARCHAR(120),
ADD COLUMN     "registration_number" VARCHAR(40);
