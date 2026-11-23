-- Rentals: delivery time slot the customer asked for (24h "HH:MM", 10:00–16:00).
ALTER TABLE "rentals" ADD COLUMN "requested_delivery_time" VARCHAR(5);
