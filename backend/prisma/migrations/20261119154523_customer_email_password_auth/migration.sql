-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "failed_login_attempts" SMALLINT NOT NULL DEFAULT 0,
ADD COLUMN     "locked_until" TIMESTAMPTZ(6),
ADD COLUMN     "password_changed_at" TIMESTAMPTZ(6),
ADD COLUMN     "password_hash" TEXT;

-- CreateTable
CREATE TABLE "email_otps" (
    "id" BIGSERIAL NOT NULL,
    "email" CITEXT NOT NULL,
    "purpose" VARCHAR(20) NOT NULL DEFAULT 'signup',
    "otp_hash" VARCHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "attempts" SMALLINT NOT NULL DEFAULT 0,
    "verified_at" TIMESTAMPTZ(6),
    "verification_token_hash" VARCHAR(64),
    "token_expires_at" TIMESTAMPTZ(6),
    "consumed_at" TIMESTAMPTZ(6),
    "ip_address" INET,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_otps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "email_otps_verification_token_hash_key" ON "email_otps"("verification_token_hash");

-- CreateIndex
CREATE INDEX "email_otps_email_purpose_created_at_idx" ON "email_otps"("email", "purpose", "created_at");
