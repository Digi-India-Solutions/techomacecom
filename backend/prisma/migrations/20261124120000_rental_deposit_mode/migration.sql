-- Rentals: refundable deposit paid online (with the booking) or by cheque (collected by staff).
ALTER TABLE "rentals" ADD COLUMN "deposit_mode" VARCHAR(10) NOT NULL DEFAULT 'online';
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_deposit_mode_check" CHECK ("deposit_mode" IN ('online', 'cheque'));
