-- Admin bell: message / severity / link per notification.
-- NOTE: emails stay CITEXT; the VarChar(255) drift Prisma reports is intentionally not applied.

-- AlterTable
ALTER TABLE "admin_notifications" ADD COLUMN     "link" VARCHAR(300),
ADD COLUMN     "message" TEXT,
ADD COLUMN     "severity" VARCHAR(10) NOT NULL DEFAULT 'info';

-- CreateIndex
CREATE INDEX "admin_notifications_admin_user_id_created_at_idx" ON "admin_notifications"("admin_user_id", "created_at");

ALTER TABLE "admin_notifications" ADD CONSTRAINT "admin_notifications_severity_chk" CHECK ("severity" IN ('info','warning','urgent'));
