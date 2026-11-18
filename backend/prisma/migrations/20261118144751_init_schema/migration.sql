-- =============================================================================
-- Extensions (must exist before the tables that use them)
--   citext  → case-insensitive email columns
--   pg_trgm → GIN trigram indexes for fast "contains" product search
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateTable
CREATE TABLE "admin_users" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" CITEXT NOT NULL,
    "mobile" VARCHAR(15),
    "password_hash" TEXT,
    "role_id" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "last_login_at" TIMESTAMPTZ(6),
    "department" VARCHAR(80),
    "failed_login_attempts" SMALLINT NOT NULL DEFAULT 0,
    "locked_until" TIMESTAMPTZ(6),
    "password_reset_token_hash" VARCHAR(64),
    "password_reset_expires_at" TIMESTAMPTZ(6),
    "password_changed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "slug" VARCHAR(60) NOT NULL,
    "description" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" BIGSERIAL NOT NULL,
    "module" VARCHAR(40) NOT NULL,
    "action" VARCHAR(20) NOT NULL,
    "code" VARCHAR(80) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" BIGSERIAL NOT NULL,
    "role_id" BIGINT NOT NULL,
    "permission_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_requests" (
    "id" BIGSERIAL NOT NULL,
    "mobile" VARCHAR(15) NOT NULL,
    "purpose" TEXT NOT NULL,
    "otp_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "attempts" SMALLINT NOT NULL DEFAULT 0,
    "verified_at" TIMESTAMPTZ(6),
    "ip_address" INET,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" BIGSERIAL NOT NULL,
    "admin_user_id" BIGINT,
    "module" VARCHAR(40) NOT NULL,
    "action" VARCHAR(40) NOT NULL,
    "entity_type" VARCHAR(40),
    "entity_id" BIGINT,
    "entity_label" VARCHAR(200),
    "summary" TEXT,
    "old_values" JSONB,
    "new_values" JSONB,
    "ip_address" INET,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_notifications" (
    "id" BIGSERIAL NOT NULL,
    "type" VARCHAR(40) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "entity_type" VARCHAR(40),
    "entity_id" BIGINT,
    "admin_user_id" BIGINT,
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_templates" (
    "id" BIGSERIAL NOT NULL,
    "event" VARCHAR(60) NOT NULL,
    "channel" TEXT NOT NULL,
    "subject" VARCHAR(200),
    "body" TEXT NOT NULL,
    "provider_template_id" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" BIGSERIAL NOT NULL,
    "template_id" BIGINT,
    "channel" TEXT NOT NULL,
    "recipient" VARCHAR(200) NOT NULL,
    "entity_type" VARCHAR(40),
    "entity_id" BIGINT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "provider_message_id" VARCHAR(120),
    "error" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(120),
    "mobile" VARCHAR(15),
    "email" CITEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "customer_type" TEXT NOT NULL DEFAULT 'individual',
    "google_id" VARCHAR(64),
    "avatar_url" TEXT,
    "mobile_verified_at" TIMESTAMPTZ(6),
    "email_verified_at" TIMESTAMPTZ(6),
    "last_login_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" BIGSERIAL NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "phone" VARCHAR(15) NOT NULL,
    "organisation_name" VARCHAR(200),
    "line1" VARCHAR(200) NOT NULL,
    "line2" VARCHAR(200),
    "landmark" VARCHAR(200),
    "city" VARCHAR(80) NOT NULL,
    "state" VARCHAR(80) NOT NULL,
    "pincode" CHAR(6) NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'home',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_gst_details" (
    "id" BIGSERIAL NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "gstin" CHAR(15) NOT NULL,
    "company_name" VARCHAR(200) NOT NULL,
    "billing_address" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_gst_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlists" (
    "id" BIGSERIAL NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" BIGSERIAL NOT NULL,
    "parent_id" BIGINT,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "level" SMALLINT NOT NULL DEFAULT 1,
    "path" TEXT,
    "icon_url" TEXT,
    "image_url" TEXT,
    "banner_desktop_url" TEXT,
    "banner_mobile_url" TEXT,
    "description" TEXT,
    "meta_title" VARCHAR(200),
    "meta_description" VARCHAR(320),
    "show_in_menu" BOOLEAN NOT NULL DEFAULT true,
    "show_on_home" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(140) NOT NULL,
    "logo_url" TEXT,
    "banner_desktop_url" TEXT,
    "banner_mobile_url" TEXT,
    "description" TEXT,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "meta_title" VARCHAR(200),
    "meta_description" VARCHAR(320),
    "status" TEXT NOT NULL DEFAULT 'active',
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(250) NOT NULL,
    "slug" VARCHAR(270) NOT NULL,
    "sku" VARCHAR(60) NOT NULL,
    "brand_id" BIGINT NOT NULL,
    "category_id" BIGINT NOT NULL,
    "short_description" VARCHAR(400),
    "description" TEXT,
    "hsn_code" VARCHAR(10),
    "gst_rate" DECIMAL(4,2) NOT NULL DEFAULT 18,
    "weight_grams" INTEGER,
    "length_cm" DECIMAL(6,1),
    "width_cm" DECIMAL(6,1),
    "height_cm" DECIMAL(6,1),
    "emi_enabled" BOOLEAN NOT NULL DEFAULT false,
    "cod_enabled" BOOLEAN NOT NULL DEFAULT true,
    "rent_enabled" BOOLEAN NOT NULL DEFAULT false,
    "sale_enabled" BOOLEAN NOT NULL DEFAULT true,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_best_seller" BOOLEAN NOT NULL DEFAULT false,
    "is_new_arrival" BOOLEAN NOT NULL DEFAULT false,
    "badge_text" VARCHAR(40),
    "rating_avg" DECIMAL(2,1) NOT NULL DEFAULT 0,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "sold_count" INTEGER NOT NULL DEFAULT 0,
    "meta_title" VARCHAR(200),
    "meta_description" VARCHAR(320),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "published_at" TIMESTAMPTZ(6),
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "option_type" VARCHAR(30) NOT NULL DEFAULT 'default',
    "name" VARCHAR(150) NOT NULL,
    "sku" VARCHAR(60) NOT NULL,
    "price_paise" BIGINT NOT NULL,
    "mrp_paise" BIGINT NOT NULL,
    "bulk_price_paise" BIGINT,
    "bulk_min_qty" SMALLINT,
    "image_url" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "url" TEXT NOT NULL,
    "zoom_url" TEXT,
    "alt_text" VARCHAR(200),
    "type" TEXT NOT NULL DEFAULT 'main',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_specs" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "spec_key" VARCHAR(100) NOT NULL,
    "spec_value" VARCHAR(300) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_specs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bulk_import_jobs" (
    "id" BIGSERIAL NOT NULL,
    "admin_user_id" BIGINT,
    "type" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "created_rows" INTEGER NOT NULL DEFAULT 0,
    "updated_rows" INTEGER NOT NULL DEFAULT 0,
    "failed_rows" INTEGER NOT NULL DEFAULT 0,
    "error_report_url" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bulk_import_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warehouses" (
    "id" BIGSERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "address" TEXT,
    "city" VARCHAR(80),
    "state" VARCHAR(80),
    "pincode" CHAR(6),
    "shiprocket_pickup_name" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warehouses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" BIGSERIAL NOT NULL,
    "variant_id" BIGINT NOT NULL,
    "warehouse_id" BIGINT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reserved" INTEGER NOT NULL DEFAULT 0,
    "low_stock_threshold" INTEGER NOT NULL DEFAULT 5,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_movements" (
    "id" BIGSERIAL NOT NULL,
    "variant_id" BIGINT NOT NULL,
    "warehouse_id" BIGINT NOT NULL,
    "change_qty" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "reference_type" VARCHAR(40),
    "reference_id" BIGINT,
    "balance_after" INTEGER NOT NULL,
    "admin_user_id" BIGINT,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_units" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "warehouse_id" BIGINT NOT NULL,
    "unit_code" VARCHAR(30) NOT NULL,
    "serial_number" VARCHAR(80) NOT NULL,
    "purchase_date" DATE,
    "purchase_cost_paise" BIGINT,
    "condition" TEXT NOT NULL DEFAULT 'new',
    "status" TEXT NOT NULL DEFAULT 'available',
    "current_rental_id" BIGINT,
    "last_service_at" DATE,
    "next_service_due" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rental_units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_unit_service_logs" (
    "id" BIGSERIAL NOT NULL,
    "rental_unit_id" BIGINT NOT NULL,
    "type" TEXT NOT NULL,
    "issue" TEXT,
    "action_taken" TEXT,
    "cost_paise" BIGINT,
    "performed_on" DATE,
    "admin_user_id" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rental_unit_service_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carts" (
    "id" BIGSERIAL NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "coupon_id" BIGINT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" BIGSERIAL NOT NULL,
    "cart_id" BIGINT NOT NULL,
    "variant_id" BIGINT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "type" TEXT NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "max_discount_paise" BIGINT,
    "min_order_paise" BIGINT,
    "applies_to" TEXT NOT NULL DEFAULT 'all',
    "applies_to_ids" BIGINT[],
    "usage_limit_total" INTEGER,
    "usage_limit_per_customer" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "first_order_only" BOOLEAN NOT NULL DEFAULT false,
    "starts_at" TIMESTAMPTZ(6),
    "ends_at" TIMESTAMPTZ(6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupon_redemptions" (
    "id" BIGSERIAL NOT NULL,
    "coupon_id" BIGINT NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "order_id" BIGINT NOT NULL,
    "discount_paise" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupon_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deals" (
    "id" BIGSERIAL NOT NULL,
    "variant_id" BIGINT NOT NULL,
    "deal_price_paise" BIGINT NOT NULL,
    "starts_at" TIMESTAMPTZ(6) NOT NULL,
    "ends_at" TIMESTAMPTZ(6) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" BIGSERIAL NOT NULL,
    "order_number" VARCHAR(20) NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_payment',
    "payment_method" TEXT NOT NULL,
    "payment_status" TEXT NOT NULL DEFAULT 'pending',
    "shipping_address" JSONB NOT NULL,
    "billing_address" JSONB,
    "gstin" CHAR(15),
    "company_name" VARCHAR(200),
    "subtotal_paise" BIGINT NOT NULL,
    "discount_paise" BIGINT NOT NULL DEFAULT 0,
    "coupon_code" VARCHAR(30),
    "coupon_discount_paise" BIGINT NOT NULL DEFAULT 0,
    "shipping_paise" BIGINT NOT NULL DEFAULT 0,
    "cod_charge_paise" BIGINT NOT NULL DEFAULT 0,
    "tax_paise" BIGINT NOT NULL DEFAULT 0,
    "total_paise" BIGINT NOT NULL,
    "placed_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMPTZ(6),
    "delivered_at" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),
    "cancel_reason" TEXT,
    "notes_internal" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "variant_id" BIGINT NOT NULL,
    "product_name" VARCHAR(250) NOT NULL,
    "variant_name" VARCHAR(150),
    "sku" VARCHAR(60) NOT NULL,
    "hsn_code" VARCHAR(10),
    "quantity" INTEGER NOT NULL,
    "unit_price_paise" BIGINT NOT NULL,
    "mrp_paise" BIGINT NOT NULL,
    "gst_rate" DECIMAL(4,2) NOT NULL,
    "cgst_paise" BIGINT NOT NULL DEFAULT 0,
    "sgst_paise" BIGINT NOT NULL DEFAULT 0,
    "igst_paise" BIGINT NOT NULL DEFAULT 0,
    "line_total_paise" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_status_history" (
    "id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "from_status" TEXT,
    "to_status" TEXT NOT NULL,
    "actor_type" TEXT NOT NULL,
    "actor_id" BIGINT,
    "note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" BIGSERIAL NOT NULL,
    "order_id" BIGINT,
    "rental_id" BIGINT,
    "purpose" TEXT NOT NULL,
    "gateway" TEXT NOT NULL,
    "gateway_order_id" VARCHAR(60),
    "gateway_payment_id" VARCHAR(60),
    "method" VARCHAR(30),
    "emi_tenure_months" SMALLINT,
    "amount_paise" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'created',
    "failure_reason" TEXT,
    "raw_response" JSONB,
    "captured_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refunds" (
    "id" BIGSERIAL NOT NULL,
    "payment_id" BIGINT,
    "order_id" BIGINT,
    "rental_id" BIGINT,
    "return_id" BIGINT,
    "gateway_refund_id" VARCHAR(60),
    "amount_paise" BIGINT NOT NULL,
    "reason" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'gateway',
    "bank_details" JSONB,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "admin_user_id" BIGINT,
    "processed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refunds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipments" (
    "id" BIGSERIAL NOT NULL,
    "order_id" BIGINT,
    "rental_id" BIGINT,
    "return_id" BIGINT,
    "direction" TEXT NOT NULL,
    "warehouse_id" BIGINT,
    "shiprocket_order_id" VARCHAR(40),
    "shiprocket_shipment_id" VARCHAR(40),
    "courier_name" VARCHAR(80),
    "awb_code" VARCHAR(40),
    "tracking_url" TEXT,
    "weight_grams" INTEGER,
    "dimensions" JSONB,
    "status" TEXT NOT NULL DEFAULT 'created',
    "pickup_date" DATE,
    "delivered_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_events" (
    "id" BIGSERIAL NOT NULL,
    "shipment_id" BIGINT NOT NULL,
    "status" VARCHAR(60) NOT NULL,
    "location" VARCHAR(120),
    "event_time" TIMESTAMPTZ(6),
    "raw" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "returns" (
    "id" BIGSERIAL NOT NULL,
    "order_id" BIGINT NOT NULL,
    "return_number" VARCHAR(20) NOT NULL,
    "reason" TEXT,
    "photos" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'requested',
    "admin_note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "returns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_items" (
    "id" BIGSERIAL NOT NULL,
    "return_id" BIGINT NOT NULL,
    "order_item_id" BIGINT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "condition_received" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "return_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_plans" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "period" TEXT NOT NULL,
    "price_paise" BIGINT NOT NULL,
    "min_periods" INTEGER NOT NULL DEFAULT 1,
    "max_periods" INTEGER NOT NULL DEFAULT 12,
    "security_deposit_paise" BIGINT NOT NULL DEFAULT 0,
    "delivery_pickup_paise" BIGINT NOT NULL DEFAULT 0,
    "kyc_required" BOOLEAN NOT NULL DEFAULT true,
    "prescription_required" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rental_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rentals" (
    "id" BIGSERIAL NOT NULL,
    "rental_number" VARCHAR(20) NOT NULL,
    "customer_id" BIGINT NOT NULL,
    "product_id" BIGINT NOT NULL,
    "rental_plan_id" BIGINT NOT NULL,
    "rental_unit_id" BIGINT,
    "product_name" VARCHAR(250) NOT NULL,
    "period" TEXT NOT NULL,
    "periods" INTEGER NOT NULL,
    "rate_paise" BIGINT NOT NULL,
    "rent_paise" BIGINT NOT NULL,
    "deposit_paise" BIGINT NOT NULL,
    "charges_paise" BIGINT NOT NULL DEFAULT 0,
    "tax_paise" BIGINT NOT NULL DEFAULT 0,
    "total_paid_paise" BIGINT NOT NULL DEFAULT 0,
    "requested_start_date" DATE,
    "start_date" DATE,
    "end_date" DATE,
    "delivery_address" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending_payment',
    "kyc_status" TEXT NOT NULL DEFAULT 'pending',
    "kyc_reviewed_by" BIGINT,
    "return_condition" TEXT,
    "return_notes" TEXT,
    "return_photos" TEXT[],
    "deposit_refund_paise" BIGINT,
    "deposit_refunded_at" TIMESTAMPTZ(6),
    "cancel_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rentals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_kyc_documents" (
    "id" BIGSERIAL NOT NULL,
    "rental_id" BIGINT NOT NULL,
    "doc_type" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "mime_type" VARCHAR(100),
    "size_bytes" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'uploaded',
    "reject_reason" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rental_kyc_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_extensions" (
    "id" BIGSERIAL NOT NULL,
    "rental_id" BIGINT NOT NULL,
    "extra_periods" INTEGER NOT NULL,
    "amount_paise" BIGINT NOT NULL,
    "old_end_date" DATE,
    "new_end_date" DATE,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "payment_id" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rental_extensions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_charges" (
    "id" BIGSERIAL NOT NULL,
    "rental_id" BIGINT NOT NULL,
    "type" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "amount_paise" BIGINT NOT NULL,
    "description" TEXT,
    "payment_id" BIGINT,
    "refund_id" BIGINT,
    "admin_user_id" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rental_charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_status_history" (
    "id" BIGSERIAL NOT NULL,
    "rental_id" BIGINT NOT NULL,
    "from_status" TEXT,
    "to_status" TEXT NOT NULL,
    "actor_type" TEXT NOT NULL,
    "actor_id" BIGINT,
    "note" TEXT,
    "rental_unit_id" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rental_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enquiries" (
    "id" BIGSERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "mobile" VARCHAR(15) NOT NULL,
    "email" CITEXT,
    "city" VARCHAR(80),
    "details" JSONB,
    "message" TEXT,
    "consent" BOOLEAN NOT NULL DEFAULT false,
    "source_page" VARCHAR(200),
    "utm_source" VARCHAR(100),
    "utm_campaign" VARCHAR(100),
    "status" TEXT NOT NULL DEFAULT 'new',
    "assigned_to" BIGINT,
    "next_follow_up_at" TIMESTAMPTZ(6),
    "customer_id" BIGINT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enquiries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enquiry_notes" (
    "id" BIGSERIAL NOT NULL,
    "enquiry_id" BIGINT NOT NULL,
    "admin_user_id" BIGINT,
    "note" TEXT NOT NULL,
    "status_after" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "enquiry_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" BIGSERIAL NOT NULL,
    "product_id" BIGINT NOT NULL,
    "customer_id" BIGINT,
    "name" VARCHAR(80) NOT NULL,
    "mobile" VARCHAR(15),
    "rating" SMALLINT NOT NULL,
    "title" VARCHAR(150),
    "comment" TEXT NOT NULL,
    "is_verified_buyer" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reject_reason" TEXT,
    "moderated_by" BIGINT,
    "moderated_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_images" (
    "id" BIGSERIAL NOT NULL,
    "review_id" BIGINT NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banners" (
    "id" BIGSERIAL NOT NULL,
    "placement" TEXT NOT NULL,
    "target_id" BIGINT,
    "title" VARCHAR(150),
    "image_desktop_url" TEXT NOT NULL,
    "image_mobile_url" TEXT,
    "link_url" TEXT,
    "alt_text" VARCHAR(200),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "starts_at" TIMESTAMPTZ(6),
    "ends_at" TIMESTAMPTZ(6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "homepage_sections" (
    "id" BIGSERIAL NOT NULL,
    "key" VARCHAR(40) NOT NULL,
    "title" VARCHAR(150),
    "config" JSONB,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "homepage_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pages" (
    "id" BIGSERIAL NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "content" TEXT,
    "meta_title" VARCHAR(200),
    "meta_description" VARCHAR(320),
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faqs" (
    "id" BIGSERIAL NOT NULL,
    "group_key" VARCHAR(30) NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" BIGSERIAL NOT NULL,
    "slug" VARCHAR(200) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "cover_image_url" TEXT,
    "excerpt" VARCHAR(400),
    "content" TEXT,
    "category" VARCHAR(60),
    "tags" TEXT[],
    "author_id" BIGINT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "published_at" TIMESTAMPTZ(6),
    "meta_title" VARCHAR(200),
    "meta_description" VARCHAR(320),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "id" BIGSERIAL NOT NULL,
    "group_key" VARCHAR(40) NOT NULL,
    "key" VARCHAR(80) NOT NULL,
    "value" JSONB,
    "is_secret" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" BIGSERIAL NOT NULL,
    "provider" TEXT NOT NULL,
    "event_id" VARCHAR(100) NOT NULL,
    "event_type" VARCHAR(60),
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'received',
    "error" TEXT,
    "processed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" BIGSERIAL NOT NULL,
    "invoice_number" VARCHAR(30) NOT NULL,
    "order_id" BIGINT,
    "rental_id" BIGINT,
    "type" TEXT NOT NULL,
    "financial_year" CHAR(7) NOT NULL,
    "total_paise" BIGINT NOT NULL,
    "tax_paise" BIGINT NOT NULL,
    "pdf_url" TEXT,
    "issued_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" BIGSERIAL NOT NULL,
    "subject_type" TEXT NOT NULL,
    "customer_id" BIGINT,
    "admin_user_id" BIGINT,
    "jti" VARCHAR(64) NOT NULL,
    "remember" BOOLEAN NOT NULL DEFAULT true,
    "user_agent" VARCHAR(300),
    "ip_address" INET,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "replaced_by" VARCHAR(64),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE INDEX "admin_users_role_id_idx" ON "admin_users"("role_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "roles_slug_key" ON "roles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_module_action_key" ON "permissions"("module", "action");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_id_permission_id_key" ON "role_permissions"("role_id", "permission_id");

-- CreateIndex
CREATE INDEX "otp_requests_mobile_idx" ON "otp_requests"("mobile");

-- CreateIndex
CREATE INDEX "otp_requests_mobile_purpose_created_at_idx" ON "otp_requests"("mobile", "purpose", "created_at");

-- CreateIndex
CREATE INDEX "activity_logs_module_idx" ON "activity_logs"("module");

-- CreateIndex
CREATE INDEX "activity_logs_entity_type_entity_id_idx" ON "activity_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "activity_logs_admin_user_id_idx" ON "activity_logs"("admin_user_id");

-- CreateIndex
CREATE INDEX "activity_logs_created_at_idx" ON "activity_logs"("created_at");

-- CreateIndex
CREATE INDEX "admin_notifications_admin_user_id_read_at_idx" ON "admin_notifications"("admin_user_id", "read_at");

-- CreateIndex
CREATE UNIQUE INDEX "notification_templates_event_channel_key" ON "notification_templates"("event", "channel");

-- CreateIndex
CREATE INDEX "notification_logs_entity_type_entity_id_idx" ON "notification_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "customers_mobile_key" ON "customers"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "customers_email_key" ON "customers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_google_id_key" ON "customers"("google_id");

-- CreateIndex
CREATE INDEX "addresses_customer_id_idx" ON "addresses"("customer_id");

-- CreateIndex
CREATE INDEX "addresses_pincode_idx" ON "addresses"("pincode");

-- CreateIndex
CREATE INDEX "customer_gst_details_customer_id_idx" ON "customer_gst_details"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "wishlists_customer_id_product_id_key" ON "wishlists"("customer_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_parent_id_idx" ON "categories"("parent_id");

-- CreateIndex
CREATE INDEX "categories_path_idx" ON "categories"("path");

-- CreateIndex
CREATE UNIQUE INDEX "brands_name_key" ON "brands"("name");

-- CreateIndex
CREATE UNIQUE INDEX "brands_slug_key" ON "brands"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_sku_key" ON "products"("sku");

-- CreateIndex
CREATE INDEX "products_brand_id_idx" ON "products"("brand_id");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "products"("status");

-- CreateIndex
CREATE INDEX "products_name_trgm_idx" ON "products" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "products_sku_trgm_idx" ON "products" USING GIN ("sku" gin_trgm_ops);

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

-- CreateIndex
CREATE INDEX "product_variants_product_id_idx" ON "product_variants"("product_id");

-- CreateIndex
CREATE INDEX "product_images_product_id_idx" ON "product_images"("product_id");

-- CreateIndex
CREATE INDEX "product_specs_product_id_idx" ON "product_specs"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "warehouses_code_key" ON "warehouses"("code");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_variant_id_warehouse_id_key" ON "inventory"("variant_id", "warehouse_id");

-- CreateIndex
CREATE INDEX "stock_movements_variant_id_created_at_idx" ON "stock_movements"("variant_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "rental_units_unit_code_key" ON "rental_units"("unit_code");

-- CreateIndex
CREATE UNIQUE INDEX "rental_units_serial_number_key" ON "rental_units"("serial_number");

-- CreateIndex
CREATE INDEX "rental_units_product_id_idx" ON "rental_units"("product_id");

-- CreateIndex
CREATE INDEX "rental_units_status_idx" ON "rental_units"("status");

-- CreateIndex
CREATE INDEX "rental_units_next_service_due_idx" ON "rental_units"("next_service_due");

-- CreateIndex
CREATE INDEX "rental_unit_service_logs_rental_unit_id_idx" ON "rental_unit_service_logs"("rental_unit_id");

-- CreateIndex
CREATE INDEX "carts_customer_id_idx" ON "carts"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_cart_id_variant_id_key" ON "cart_items"("cart_id", "variant_id");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE UNIQUE INDEX "coupon_redemptions_order_id_key" ON "coupon_redemptions"("order_id");

-- CreateIndex
CREATE INDEX "coupon_redemptions_coupon_id_customer_id_idx" ON "coupon_redemptions"("coupon_id", "customer_id");

-- CreateIndex
CREATE INDEX "deals_starts_at_ends_at_idx" ON "deals"("starts_at", "ends_at");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE INDEX "orders_customer_id_idx" ON "orders"("customer_id");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_placed_at_idx" ON "orders"("placed_at");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_status_history_order_id_idx" ON "order_status_history"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_gateway_order_id_key" ON "payments"("gateway_order_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_gateway_payment_id_key" ON "payments"("gateway_payment_id");

-- CreateIndex
CREATE INDEX "payments_order_id_idx" ON "payments"("order_id");

-- CreateIndex
CREATE INDEX "payments_rental_id_idx" ON "payments"("rental_id");

-- CreateIndex
CREATE UNIQUE INDEX "refunds_gateway_refund_id_key" ON "refunds"("gateway_refund_id");

-- CreateIndex
CREATE UNIQUE INDEX "shipments_awb_code_key" ON "shipments"("awb_code");

-- CreateIndex
CREATE INDEX "shipments_order_id_idx" ON "shipments"("order_id");

-- CreateIndex
CREATE INDEX "shipments_rental_id_idx" ON "shipments"("rental_id");

-- CreateIndex
CREATE INDEX "shipment_events_shipment_id_idx" ON "shipment_events"("shipment_id");

-- CreateIndex
CREATE UNIQUE INDEX "returns_return_number_key" ON "returns"("return_number");

-- CreateIndex
CREATE INDEX "returns_order_id_idx" ON "returns"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "rental_plans_product_id_period_key" ON "rental_plans"("product_id", "period");

-- CreateIndex
CREATE UNIQUE INDEX "rentals_rental_number_key" ON "rentals"("rental_number");

-- CreateIndex
CREATE INDEX "rentals_customer_id_idx" ON "rentals"("customer_id");

-- CreateIndex
CREATE INDEX "rentals_status_idx" ON "rentals"("status");

-- CreateIndex
CREATE INDEX "rentals_rental_unit_id_idx" ON "rentals"("rental_unit_id");

-- CreateIndex
CREATE INDEX "rental_kyc_documents_rental_id_idx" ON "rental_kyc_documents"("rental_id");

-- CreateIndex
CREATE INDEX "rental_extensions_rental_id_idx" ON "rental_extensions"("rental_id");

-- CreateIndex
CREATE INDEX "rental_charges_rental_id_idx" ON "rental_charges"("rental_id");

-- CreateIndex
CREATE INDEX "rental_status_history_rental_id_idx" ON "rental_status_history"("rental_id");

-- CreateIndex
CREATE INDEX "enquiries_type_idx" ON "enquiries"("type");

-- CreateIndex
CREATE INDEX "enquiries_mobile_idx" ON "enquiries"("mobile");

-- CreateIndex
CREATE INDEX "enquiries_status_idx" ON "enquiries"("status");

-- CreateIndex
CREATE INDEX "enquiry_notes_enquiry_id_idx" ON "enquiry_notes"("enquiry_id");

-- CreateIndex
CREATE INDEX "reviews_product_id_status_idx" ON "reviews"("product_id", "status");

-- CreateIndex
CREATE INDEX "review_images_review_id_idx" ON "review_images"("review_id");

-- CreateIndex
CREATE INDEX "banners_placement_target_id_idx" ON "banners"("placement", "target_id");

-- CreateIndex
CREATE UNIQUE INDEX "homepage_sections_key_key" ON "homepage_sections"("key");

-- CreateIndex
CREATE UNIQUE INDEX "pages_slug_key" ON "pages"("slug");

-- CreateIndex
CREATE INDEX "faqs_group_key_idx" ON "faqs"("group_key");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_status_published_at_idx" ON "blog_posts"("status", "published_at");

-- CreateIndex
CREATE UNIQUE INDEX "settings_group_key_key_key" ON "settings"("group_key", "key");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_provider_event_id_key" ON "webhook_events"("provider", "event_id");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_jti_key" ON "auth_sessions"("jti");

-- CreateIndex
CREATE INDEX "auth_sessions_customer_id_idx" ON "auth_sessions"("customer_id");

-- CreateIndex
CREATE INDEX "auth_sessions_admin_user_id_idx" ON "auth_sessions"("admin_user_id");

-- AddForeignKey
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_notifications" ADD CONSTRAINT "admin_notifications_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "notification_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_gst_details" ADD CONSTRAINT "customer_gst_details_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlists" ADD CONSTRAINT "wishlists_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_specs" ADD CONSTRAINT "product_specs_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bulk_import_jobs" ADD CONSTRAINT "bulk_import_jobs_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_units" ADD CONSTRAINT "rental_units_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_units" ADD CONSTRAINT "rental_units_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_units" ADD CONSTRAINT "rental_units_current_rental_id_fkey" FOREIGN KEY ("current_rental_id") REFERENCES "rentals"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "rental_unit_service_logs" ADD CONSTRAINT "rental_unit_service_logs_rental_unit_id_fkey" FOREIGN KEY ("rental_unit_id") REFERENCES "rental_units"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_unit_service_logs" ADD CONSTRAINT "rental_unit_service_logs_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carts" ADD CONSTRAINT "carts_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "coupons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deals" ADD CONSTRAINT "deals_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "rentals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "rentals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_return_id_fkey" FOREIGN KEY ("return_id") REFERENCES "returns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "rentals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_return_id_fkey" FOREIGN KEY ("return_id") REFERENCES "returns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_warehouse_id_fkey" FOREIGN KEY ("warehouse_id") REFERENCES "warehouses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipment_events" ADD CONSTRAINT "shipment_events_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "returns" ADD CONSTRAINT "returns_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_return_id_fkey" FOREIGN KEY ("return_id") REFERENCES "returns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_plans" ADD CONSTRAINT "rental_plans_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_rental_plan_id_fkey" FOREIGN KEY ("rental_plan_id") REFERENCES "rental_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_rental_unit_id_fkey" FOREIGN KEY ("rental_unit_id") REFERENCES "rental_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_kyc_reviewed_by_fkey" FOREIGN KEY ("kyc_reviewed_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_kyc_documents" ADD CONSTRAINT "rental_kyc_documents_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "rentals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_extensions" ADD CONSTRAINT "rental_extensions_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "rentals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_extensions" ADD CONSTRAINT "rental_extensions_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_charges" ADD CONSTRAINT "rental_charges_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "rentals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_charges" ADD CONSTRAINT "rental_charges_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_charges" ADD CONSTRAINT "rental_charges_refund_id_fkey" FOREIGN KEY ("refund_id") REFERENCES "refunds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_charges" ADD CONSTRAINT "rental_charges_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_status_history" ADD CONSTRAINT "rental_status_history_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "rentals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_status_history" ADD CONSTRAINT "rental_status_history_rental_unit_id_fkey" FOREIGN KEY ("rental_unit_id") REFERENCES "rental_units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiry_notes" ADD CONSTRAINT "enquiry_notes_enquiry_id_fkey" FOREIGN KEY ("enquiry_id") REFERENCES "enquiries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enquiry_notes" ADD CONSTRAINT "enquiry_notes_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_moderated_by_fkey" FOREIGN KEY ("moderated_by") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_images" ADD CONSTRAINT "review_images_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_rental_id_fkey" FOREIGN KEY ("rental_id") REFERENCES "rentals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "admin_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================================================
-- Rules Prisma cannot express (document §10 conventions)
-- =============================================================================

-- ---------- CHECK constraints on status / enum-like TEXT columns -------------
ALTER TABLE "admin_users"   ADD CONSTRAINT "admin_users_status_chk"   CHECK ("status" IN ('active','inactive'));
ALTER TABLE "permissions"   ADD CONSTRAINT "permissions_action_chk"   CHECK ("action" IN ('view','create','edit','delete','export'));
ALTER TABLE "otp_requests"  ADD CONSTRAINT "otp_requests_purpose_chk" CHECK ("purpose" IN ('login','review'));
ALTER TABLE "otp_requests"  ADD CONSTRAINT "otp_requests_attempts_chk" CHECK ("attempts" BETWEEN 0 AND 5);
ALTER TABLE "notification_templates" ADD CONSTRAINT "notification_templates_channel_chk" CHECK ("channel" IN ('sms','whatsapp','email'));
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_channel_chk" CHECK ("channel" IN ('sms','whatsapp','email'));
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_status_chk"  CHECK ("status" IN ('queued','sent','failed'));

ALTER TABLE "customers" ADD CONSTRAINT "customers_status_chk" CHECK ("status" IN ('active','blocked'));
ALTER TABLE "customers" ADD CONSTRAINT "customers_type_chk"   CHECK ("customer_type" IN ('doctor','clinic_admin','procurement','individual'));
ALTER TABLE "customers" ADD CONSTRAINT "customers_identity_chk" CHECK ("mobile" IS NOT NULL OR "email" IS NOT NULL);
ALTER TABLE "customers" ADD CONSTRAINT "customers_mobile_chk" CHECK ("mobile" IS NULL OR "mobile" ~ '^[6-9][0-9]{9}$');
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_type_chk"    CHECK ("type" IN ('home','clinic','hospital','other'));
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_pincode_chk" CHECK ("pincode" ~ '^[1-9][0-9]{5}$');
ALTER TABLE "customer_gst_details" ADD CONSTRAINT "customer_gst_details_gstin_chk"
  CHECK ("gstin" ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$');

ALTER TABLE "categories" ADD CONSTRAINT "categories_level_chk"  CHECK ("level" BETWEEN 1 AND 3);
ALTER TABLE "categories" ADD CONSTRAINT "categories_status_chk" CHECK ("status" IN ('active','inactive'));
ALTER TABLE "brands"     ADD CONSTRAINT "brands_status_chk"     CHECK ("status" IN ('active','inactive'));
ALTER TABLE "products"   ADD CONSTRAINT "products_gst_rate_chk" CHECK ("gst_rate" IN (0, 5, 12, 18, 28));
ALTER TABLE "products"   ADD CONSTRAINT "products_status_chk"   CHECK ("status" IN ('draft','active','inactive'));
ALTER TABLE "products"   ADD CONSTRAINT "products_rating_chk"   CHECK ("rating_avg" BETWEEN 0 AND 5);
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_price_chk" CHECK ("price_paise" > 0);
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_mrp_chk"   CHECK ("mrp_paise" >= "price_paise");
ALTER TABLE "product_images"   ADD CONSTRAINT "product_images_type_chk"
  CHECK ("type" IN ('main','angle','detail','in_use','box_contents','infographic'));
ALTER TABLE "bulk_import_jobs" ADD CONSTRAINT "bulk_import_jobs_type_chk"   CHECK ("type" IN ('products','price_stock'));
ALTER TABLE "bulk_import_jobs" ADD CONSTRAINT "bulk_import_jobs_status_chk" CHECK ("status" IN ('queued','processing','done','failed'));

ALTER TABLE "inventory" ADD CONSTRAINT "inventory_quantity_chk" CHECK ("quantity" >= 0);
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_reserved_chk" CHECK ("reserved" >= 0);
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_reason_chk"
  CHECK ("reason" IN ('purchase','sale','return','damage','correction','reserve','release'));
ALTER TABLE "rental_units" ADD CONSTRAINT "rental_units_condition_chk"
  CHECK ("condition" IN ('new','good','needs_service','damaged','retired'));
ALTER TABLE "rental_units" ADD CONSTRAINT "rental_units_status_chk"
  CHECK ("status" IN ('available','reserved','in_transit','with_customer','under_service','retired'));
ALTER TABLE "rental_unit_service_logs" ADD CONSTRAINT "rental_unit_service_logs_type_chk"
  CHECK ("type" IN ('service','repair','sanitisation','inspection'));

ALTER TABLE "carts"      ADD CONSTRAINT "carts_status_chk"     CHECK ("status" IN ('open','converted','abandoned'));
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_quantity_chk" CHECK ("quantity" > 0);
ALTER TABLE "coupons"    ADD CONSTRAINT "coupons_type_chk"       CHECK ("type" IN ('percent','flat'));
ALTER TABLE "coupons"    ADD CONSTRAINT "coupons_applies_to_chk" CHECK ("applies_to" IN ('all','categories','products','brands'));
ALTER TABLE "coupons"    ADD CONSTRAINT "coupons_code_upper_chk" CHECK ("code" = UPPER("code"));

ALTER TABLE "orders" ADD CONSTRAINT "orders_status_chk" CHECK ("status" IN
  ('pending_payment','payment_failed','confirmed','packed','shipped','delivered','cancelled','return_requested','returned'));
ALTER TABLE "orders" ADD CONSTRAINT "orders_payment_method_chk" CHECK ("payment_method" IN ('razorpay','emi','cod'));
ALTER TABLE "orders" ADD CONSTRAINT "orders_payment_status_chk" CHECK ("payment_status" IN
  ('pending','paid','failed','refunded','partially_refunded'));
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_quantity_chk" CHECK ("quantity" > 0);
ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_actor_chk" CHECK ("actor_type" IN ('system','customer','admin','webhook'));
ALTER TABLE "payments" ADD CONSTRAINT "payments_target_chk"  CHECK (("order_id" IS NULL) <> ("rental_id" IS NULL)); -- exactly one
ALTER TABLE "payments" ADD CONSTRAINT "payments_purpose_chk" CHECK ("purpose" IN ('order','rental_booking','rental_extension','late_fee'));
ALTER TABLE "payments" ADD CONSTRAINT "payments_gateway_chk" CHECK ("gateway" IN ('razorpay','cod'));
ALTER TABLE "payments" ADD CONSTRAINT "payments_status_chk"  CHECK ("status" IN ('created','authorized','captured','failed'));
ALTER TABLE "refunds"  ADD CONSTRAINT "refunds_reason_chk"   CHECK ("reason" IN ('cancel','return','deposit_refund','goodwill'));
ALTER TABLE "refunds"  ADD CONSTRAINT "refunds_method_chk"   CHECK ("method" IN ('gateway','bank_transfer'));
ALTER TABLE "refunds"  ADD CONSTRAINT "refunds_status_chk"   CHECK ("status" IN ('processing','processed','failed'));
ALTER TABLE "refunds"  ADD CONSTRAINT "refunds_amount_chk"   CHECK ("amount_paise" > 0);
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_direction_chk" CHECK ("direction" IN ('forward','reverse'));
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_status_chk" CHECK ("status" IN
  ('created','pickup_scheduled','picked_up','in_transit','out_for_delivery','delivered','rto','cancelled'));
ALTER TABLE "returns" ADD CONSTRAINT "returns_status_chk" CHECK ("status" IN
  ('requested','approved','pickup_scheduled','received','refunded','rejected'));
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_condition_chk" CHECK ("condition_received" IS NULL OR "condition_received" IN ('resellable','damaged'));

ALTER TABLE "rental_plans" ADD CONSTRAINT "rental_plans_period_chk"  CHECK ("period" IN ('daily','weekly','monthly'));
ALTER TABLE "rental_plans" ADD CONSTRAINT "rental_plans_periods_chk" CHECK ("min_periods" >= 1 AND "min_periods" <= "max_periods");
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_status_chk" CHECK ("status" IN
  ('pending_payment','pending_approval','approved','dispatched','active','extension_requested','overdue',
   'return_scheduled','returned','deposit_refunded','cancelled'));
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_kyc_status_chk" CHECK ("kyc_status" IN ('pending','approved','rejected','reupload_requested'));
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_return_condition_chk" CHECK ("return_condition" IS NULL OR "return_condition" IN ('good','needs_service','damaged'));
ALTER TABLE "rental_kyc_documents" ADD CONSTRAINT "rental_kyc_documents_type_chk"   CHECK ("doc_type" IN ('id_front','id_back','address_proof','prescription'));
ALTER TABLE "rental_kyc_documents" ADD CONSTRAINT "rental_kyc_documents_status_chk" CHECK ("status" IN ('uploaded','approved','rejected'));
ALTER TABLE "rental_extensions" ADD CONSTRAINT "rental_extensions_status_chk" CHECK ("status" IN ('requested','approved','paid','rejected'));
ALTER TABLE "rental_charges" ADD CONSTRAINT "rental_charges_type_chk" CHECK ("type" IN
  ('rent','deposit','delivery_pickup','extension','late_fee','damage','missing_accessory','deposit_refund'));
ALTER TABLE "rental_charges" ADD CONSTRAINT "rental_charges_direction_chk" CHECK ("direction" IN ('debit','credit'));
ALTER TABLE "rental_status_history" ADD CONSTRAINT "rental_status_history_actor_chk" CHECK ("actor_type" IN ('system','customer','admin','webhook'));

ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_type_chk"   CHECK ("type" IN ('sleep_test','bulk','contact'));
ALTER TABLE "enquiries" ADD CONSTRAINT "enquiries_status_chk" CHECK ("status" IN ('new','contacted','follow_up','converted','closed'));
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_rating_chk"  CHECK ("rating" BETWEEN 1 AND 5);
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_comment_chk" CHECK (char_length("comment") BETWEEN 20 AND 600);
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_status_chk"  CHECK ("status" IN ('pending','approved','rejected'));

ALTER TABLE "banners" ADD CONSTRAINT "banners_placement_chk" CHECK ("placement" IN
  ('hero','category','brand','best_sellers','new_arrivals','offers','hot_selling','deal_of_day','brands_page','rental','sleep_test'));
ALTER TABLE "faqs" ADD CONSTRAINT "faqs_group_chk" CHECK ("group_key" IN ('general','rental','sleep_test','product'));
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_status_chk" CHECK ("status" IN ('draft','scheduled','published'));
ALTER TABLE "settings" ADD CONSTRAINT "settings_group_chk" CHECK ("group_key" IN ('general','store','shipping','payments','tax','rental','notifications'));
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_provider_chk" CHECK ("provider" IN ('razorpay','shiprocket'));
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_status_chk" CHECK ("status" IN ('received','processed','failed','ignored'));
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_type_chk"   CHECK ("type" IN ('b2c','b2b'));
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_target_chk" CHECK (("order_id" IS NULL) <> ("rental_id" IS NULL));

ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_subject_chk" CHECK (
  ("subject_type" = 'customer' AND "customer_id" IS NOT NULL AND "admin_user_id" IS NULL) OR
  ("subject_type" = 'admin'    AND "admin_user_id" IS NOT NULL AND "customer_id" IS NULL));

-- ---------- Partial unique indexes -------------------------------------------
-- (named *_partial_uq; Prisma does not model partial indexes — see prisma/README.md)
CREATE UNIQUE INDEX "addresses_one_default_partial_uq"        ON "addresses" ("customer_id") WHERE "is_default";
CREATE UNIQUE INDEX "product_variants_one_default_partial_uq" ON "product_variants" ("product_id") WHERE "is_default";
CREATE UNIQUE INDEX "carts_one_open_partial_uq"               ON "carts" ("customer_id") WHERE "status" = 'open';
CREATE UNIQUE INDEX "rentals_unit_one_open_partial_uq"        ON "rentals" ("rental_unit_id")
  WHERE "rental_unit_id" IS NOT NULL AND "status" NOT IN ('returned','deposit_refunded','cancelled');

-- ---------- updated_at trigger on every table --------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t text;
BEGIN
  FOR t IN
    SELECT c.table_name FROM information_schema.columns c
    JOIN information_schema.tables tb ON tb.table_name = c.table_name AND tb.table_schema = c.table_schema
    WHERE c.table_schema = current_schema() AND c.column_name = 'updated_at' AND tb.table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
                   t || '_set_updated_at', t);
  END LOOP;
END $$;
