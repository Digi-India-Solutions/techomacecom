-- Returns, replacements and refunds.
-- NOTE: emails stay CITEXT (case-insensitive). schema.prisma says VarChar(255), which Prisma
-- reports as drift — intentionally NOT changed here.

-- AlterTable
ALTER TABLE "refunds" ADD COLUMN     "failure_reason" TEXT,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "reference" VARCHAR(80);

-- AlterTable
ALTER TABLE "return_items" ADD COLUMN     "refund_amount_paise" BIGINT NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "returns" ADD COLUMN     "customer_note" TEXT,
ADD COLUMN     "refund_account" TEXT,
ADD COLUMN     "rejection_reason" TEXT,
ADD COLUMN     "requested_amount_paise" BIGINT NOT NULL DEFAULT 0,
ADD COLUMN     "resolved_at" TIMESTAMPTZ(6),
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'refund';

-- CreateTable
CREATE TABLE "return_status_history" (
    "id" BIGSERIAL NOT NULL,
    "return_id" BIGINT NOT NULL,
    "from_status" TEXT,
    "to_status" TEXT NOT NULL,
    "actor_type" TEXT NOT NULL,
    "actor_id" BIGINT,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "return_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "return_status_history_return_id_idx" ON "return_status_history"("return_id");

-- CreateIndex
CREATE INDEX "return_items_order_item_id_idx" ON "return_items"("order_item_id");

-- CreateIndex
CREATE INDEX "returns_status_idx" ON "returns"("status");

-- AddForeignKey
ALTER TABLE "return_status_history" ADD CONSTRAINT "return_status_history_return_id_fkey" FOREIGN KEY ("return_id") REFERENCES "returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------- Hand-written: CHECKs, trigger, data from the old JSON admin_note ----------
ALTER TABLE "returns" DROP CONSTRAINT IF EXISTS "returns_status_chk";
ALTER TABLE "returns" ADD CONSTRAINT "returns_status_chk" CHECK ("status" IN
  ('requested','approved','pickup_scheduled','received','replacement_shipped','refunded','completed','rejected','cancelled'));
ALTER TABLE "returns" ADD CONSTRAINT "returns_type_chk" CHECK ("type" IN ('refund','replacement'));
ALTER TABLE "returns" ADD CONSTRAINT "returns_requested_amount_chk" CHECK ("requested_amount_paise" >= 0);
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_quantity_chk" CHECK ("quantity" > 0);
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_refund_amount_chk" CHECK ("refund_amount_paise" >= 0);
ALTER TABLE "return_status_history" ADD CONSTRAINT "return_status_history_actor_chk" CHECK ("actor_type" IN ('system','customer','admin'));
ALTER TABLE "refunds" DROP CONSTRAINT IF EXISTS "refunds_method_chk";
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_method_chk" CHECK ("method" IN ('gateway','bank_transfer','upi'));

CREATE TRIGGER "return_status_history_set_updated_at" BEFORE UPDATE ON "return_status_history"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Earlier code kept { customerNote, adminNote, pickupDate, bankDetails } as JSON in admin_note.
UPDATE "returns"
SET "customer_note" = NULLIF("admin_note"::jsonb ->> 'customerNote', ''),
    "admin_note"    = NULLIF("admin_note"::jsonb ->> 'adminNote', '')
WHERE "admin_note" LIKE '{%';

-- Manual (bank transfer) refunds stored the UTR in gateway_refund_id.
UPDATE "refunds" SET "reference" = "gateway_refund_id", "gateway_refund_id" = NULL
WHERE "method" = 'bank_transfer' AND "gateway_refund_id" IS NOT NULL AND "gateway_refund_id" NOT LIKE 'rfnd\_%';

-- Refund estimate + timeline for returns created before this migration.
UPDATE "return_items" ri SET "refund_amount_paise" = oi."line_total_paise" * ri."quantity" / GREATEST(oi."quantity", 1)
FROM "order_items" oi WHERE oi."id" = ri."order_item_id" AND ri."refund_amount_paise" = 0;
UPDATE "returns" r SET "requested_amount_paise" = COALESCE((SELECT SUM(ri."refund_amount_paise") FROM "return_items" ri WHERE ri."return_id" = r."id"), 0);
UPDATE "returns" SET "resolved_at" = "updated_at" WHERE "status" IN ('refunded','completed','rejected','cancelled') AND "resolved_at" IS NULL;
INSERT INTO "return_status_history" ("return_id", "from_status", "to_status", "actor_type", "note", "created_at")
SELECT "id", NULL, 'requested', 'customer', 'Return requested', "created_at" FROM "returns";
INSERT INTO "return_status_history" ("return_id", "from_status", "to_status", "actor_type", "note", "created_at")
SELECT "id", 'requested', "status", 'admin', NULL, "updated_at" FROM "returns" WHERE "status" <> 'requested';
