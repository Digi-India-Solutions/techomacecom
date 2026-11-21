-- CreateTable
CREATE TABLE "serviceable_pincodes" (
    "pincode" CHAR(6) NOT NULL,
    "city" VARCHAR(80),
    "state" VARCHAR(80),
    "cod_available" BOOLEAN NOT NULL DEFAULT true,
    "delivery_days" VARCHAR(30),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "serviceable_pincodes_pkey" PRIMARY KEY ("pincode")
);

-- CreateIndex
CREATE INDEX "serviceable_pincodes_state_idx" ON "serviceable_pincodes"("state");

-- Hand-written: PIN format check + keep updated_at fresh like every other table
ALTER TABLE "serviceable_pincodes" ADD CONSTRAINT "serviceable_pincodes_pincode_chk" CHECK ("pincode" ~ '^[1-9][0-9]{5}$');
CREATE TRIGGER "serviceable_pincodes_set_updated_at" BEFORE UPDATE ON "serviceable_pincodes"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
