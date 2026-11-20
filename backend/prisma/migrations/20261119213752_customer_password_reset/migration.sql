-- "Forgot password" for storefront customers: emailed one-time link (only the SHA-256 is stored)
-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "password_reset_expires_at" TIMESTAMPTZ(6),
ADD COLUMN     "password_reset_requested_at" TIMESTAMPTZ(6),
ADD COLUMN     "password_reset_token_hash" VARCHAR(64);

-- CreateIndex
CREATE UNIQUE INDEX "customers_password_reset_token_hash_key" ON "customers"("password_reset_token_hash");
