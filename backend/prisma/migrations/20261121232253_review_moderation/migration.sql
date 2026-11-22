-- Reviews: home-page feature flag, store reply, one review per customer per product
-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "admin_reply" TEXT,
ADD COLUMN     "admin_reply_at" TIMESTAMPTZ(6),
ADD COLUMN     "is_featured" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "reviews_status_is_featured_idx" ON "reviews"("status", "is_featured");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_product_id_customer_id_key" ON "reviews"("product_id", "customer_id");
