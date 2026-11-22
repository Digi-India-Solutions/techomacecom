-- Rentals: advance (partial) payment, KYC documents (re-enabled by the client 2026-11-21), lifecycle timestamps.
-- NOTE: emails stay CITEXT; the VarChar(255) drift Prisma reports is intentionally not applied.

-- AlterTable
ALTER TABLE "rentals" ADD COLUMN     "advance_paise" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "advance_percent" SMALLINT NOT NULL DEFAULT 100,
ADD COLUMN     "balance_due" TEXT NOT NULL DEFAULT 'before_dispatch',
ADD COLUMN     "cancelled_at" TIMESTAMPTZ(6),
ADD COLUMN     "delivered_at" TIMESTAMPTZ(6),
ADD COLUMN     "dispatched_at" TIMESTAMPTZ(6),
ADD COLUMN     "kyc_note" TEXT,
ADD COLUMN     "kyc_required_docs" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "kyc_reviewed_at" TIMESTAMPTZ(6),
ADD COLUMN     "kyc_reviewed_by" BIGINT,
ADD COLUMN     "kyc_status" TEXT,
ADD COLUMN     "notes_internal" TEXT,
ADD COLUMN     "return_requested_on" DATE,
ADD COLUMN     "returned_at" TIMESTAMPTZ(6);

-- CreateTable
CREATE TABLE "rental_kyc_documents" (
    "id" BIGSERIAL NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "rental_id" BIGINT,
    "doc_type" VARCHAR(40) NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_name" VARCHAR(200) NOT NULL,
    "mime_type" VARCHAR(60) NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'uploaded',
    "reject_reason" TEXT,
    "reviewed_by" BIGINT,
    "reviewed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rental_kyc_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rental_kyc_documents_rental_id_idx" ON "rental_kyc_documents"("rental_id");

-- CreateIndex
CREATE INDEX "rental_kyc_documents_customer_id_idx" ON "rental_kyc_documents"("customer_id");

-- AddForeignKey
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_kyc_reviewed_by_fkey" FOREIGN KEY ("kyc_reviewed_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_kyc_documents" ADD CONSTRAINT "rental_kyc_documents_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_kyc_documents" ADD CONSTRAINT "rental_kyc_documents_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "rentals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_kyc_documents" ADD CONSTRAINT "rental_kyc_documents_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------- Hand-written ----------
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_advance_percent_chk" CHECK ("advance_percent" BETWEEN 1 AND 100);
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_advance_paise_chk" CHECK ("advance_paise" >= 0);
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_balance_due_chk" CHECK ("balance_due" IN ('before_dispatch','on_delivery'));
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_kyc_status_chk" CHECK ("kyc_status" IS NULL OR "kyc_status" IN ('pending','submitted','approved','rejected'));

ALTER TABLE "rental_kyc_documents" ADD CONSTRAINT "rental_kyc_documents_type_chk" CHECK ("doc_type" IN
  ('aadhaar','pan','driving_licence','passport','voter_id','address_proof','prescription','photo'));
ALTER TABLE "rental_kyc_documents" ADD CONSTRAINT "rental_kyc_documents_status_chk" CHECK ("status" IN ('uploaded','approved','rejected'));
ALTER TABLE "rental_kyc_documents" ADD CONSTRAINT "rental_kyc_documents_size_chk" CHECK ("size_bytes" > 0);
CREATE TRIGGER "rental_kyc_documents_set_updated_at" BEFORE UPDATE ON "rental_kyc_documents"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Offline rental payments (cash / UPI / bank transfer recorded by staff)
ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_gateway_chk";
ALTER TABLE "payments" ADD CONSTRAINT "payments_gateway_chk" CHECK ("gateway" IN ('razorpay','cod','manual'));

-- Settings → "Returns & Refunds" tab (added 2026-11-21) needs its own group
ALTER TABLE "settings" DROP CONSTRAINT IF EXISTS "settings_group_chk";
ALTER TABLE "settings" ADD CONSTRAINT "settings_group_chk" CHECK ("group_key" IN
  ('general','store','shipping','payments','tax','rental','returns','notifications'));
