CREATE TYPE "public"."egg_grade" AS ENUM('small', 'medium', 'large', 'xlarge', 'mixed');--> statement-breakpoint
CREATE TYPE "public"."expense_category" AS ENUM('vaccine', 'feed', 'meds', 'labor', 'utilities', 'other');--> statement-breakpoint
CREATE TYPE "public"."flock_stage" AS ENUM('chick', 'grower', 'layer', 'broiler_ready', 'culled');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('draft', 'sent', 'paid', 'void');--> statement-breakpoint
CREATE TYPE "public"."member_role" AS ENUM('owner', 'staff');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'paid', 'fulfilled', 'cancelled', 'failed');--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('eggs', 'live_chicken', 'processed', 'other');--> statement-breakpoint
CREATE TYPE "public"."sale_channel" AS ENUM('internal', 'storefront');--> statement-breakpoint
CREATE TYPE "public"."sale_type" AS ENUM('eggs', 'chicken', 'other');--> statement-breakpoint
CREATE TYPE "public"."theme_layout" AS ENUM('classic', 'bold', 'minimal');--> statement-breakpoint
CREATE TABLE "cage_access_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"cage_id" uuid NOT NULL,
	"member_id" uuid,
	"user_id" text,
	"entered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"exited_at" timestamp with time zone,
	"purpose" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"name" text NOT NULL,
	"capacity" integer DEFAULT 50 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "egg_collections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"flock_id" uuid,
	"cage_id" uuid,
	"collected_on" date NOT NULL,
	"quantity" integer NOT NULL,
	"broken_count" integer DEFAULT 0 NOT NULL,
	"grade" "egg_grade" DEFAULT 'mixed' NOT NULL,
	"notes" text,
	"recorded_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"category" "expense_category" NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"incurred_on" date NOT NULL,
	"notes" text,
	"receipt_url" text,
	"recorded_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "farm_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" "member_role" DEFAULT 'staff' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "farms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"currency" text DEFAULT 'KES' NOT NULL,
	"timezone" text DEFAULT 'Africa/Nairobi' NOT NULL,
	"paystack_public_key" text,
	"paystack_secret_key" text,
	"paystack_subaccount" text,
	"storefront_published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flock_stage_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"flock_id" uuid NOT NULL,
	"farm_id" uuid NOT NULL,
	"from_stage" "flock_stage",
	"to_stage" "flock_stage" NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"changed_by_user_id" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "flocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"cage_id" uuid,
	"name" text NOT NULL,
	"breed" text DEFAULT 'Local' NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"acquired_at" date NOT NULL,
	"stage" "flock_stage" DEFAULT 'chick' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"description" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(14, 2) NOT NULL,
	"line_total" numeric(14, 2) NOT NULL,
	"sale_type" "sale_type" DEFAULT 'eggs' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"number" text NOT NULL,
	"counterparty_name" text NOT NULL,
	"counterparty_email" text,
	"counterparty_phone" text,
	"status" "invoice_status" DEFAULT 'draft' NOT NULL,
	"issued_on" date NOT NULL,
	"due_on" date,
	"notes" text,
	"subtotal" numeric(14, 2) DEFAULT '0' NOT NULL,
	"total" numeric(14, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid,
	"title" text NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(14, 2) NOT NULL,
	"line_total" numeric(14, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"buyer_name" text NOT NULL,
	"buyer_email" text NOT NULL,
	"buyer_phone" text,
	"subtotal" numeric(14, 2) NOT NULL,
	"total" numeric(14, 2) NOT NULL,
	"currency" text DEFAULT 'KES' NOT NULL,
	"paystack_reference" text,
	"paystack_access_code" text,
	"paid_at" timestamp with time zone,
	"fulfilled_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"type" "product_type" DEFAULT 'eggs' NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"image_url" text,
	"price" numeric(14, 2) NOT NULL,
	"stock_qty" integer DEFAULT 0 NOT NULL,
	"unit_label" text DEFAULT 'tray' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"low_stock_threshold" integer DEFAULT 5 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"channel" "sale_channel" DEFAULT 'internal' NOT NULL,
	"type" "sale_type" NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(14, 2) NOT NULL,
	"total" numeric(14, 2) NOT NULL,
	"sold_on" date NOT NULL,
	"customer_name" text,
	"notes" text,
	"invoice_id" uuid,
	"order_id" uuid,
	"product_id" uuid,
	"recorded_by_user_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "storefront_themes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_id" uuid NOT NULL,
	"layout" "theme_layout" DEFAULT 'classic' NOT NULL,
	"primary_color" text DEFAULT '#2d6a4f' NOT NULL,
	"background_color" text DEFAULT '#f8faf6' NOT NULL,
	"text_color" text DEFAULT '#1a1a1a' NOT NULL,
	"accent_color" text DEFAULT '#d4a373' NOT NULL,
	"font_heading" text DEFAULT 'Fraunces' NOT NULL,
	"font_body" text DEFAULT 'DM Sans' NOT NULL,
	"logo_url" text,
	"hero_image_url" text,
	"hero_headline" text DEFAULT 'Farm-fresh eggs & poultry',
	"about_blurb" text,
	"contact_phone" text,
	"contact_whatsapp" text,
	"contact_email" text,
	"shipping_notes" text,
	"custom_css" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "storefront_themes_farm_id_unique" UNIQUE("farm_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"image_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cage_access_logs" ADD CONSTRAINT "cage_access_logs_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cage_access_logs" ADD CONSTRAINT "cage_access_logs_cage_id_cages_id_fk" FOREIGN KEY ("cage_id") REFERENCES "public"."cages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cage_access_logs" ADD CONSTRAINT "cage_access_logs_member_id_farm_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."farm_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cage_access_logs" ADD CONSTRAINT "cage_access_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cages" ADD CONSTRAINT "cages_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "egg_collections" ADD CONSTRAINT "egg_collections_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "egg_collections" ADD CONSTRAINT "egg_collections_flock_id_flocks_id_fk" FOREIGN KEY ("flock_id") REFERENCES "public"."flocks"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "egg_collections" ADD CONSTRAINT "egg_collections_cage_id_cages_id_fk" FOREIGN KEY ("cage_id") REFERENCES "public"."cages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "egg_collections" ADD CONSTRAINT "egg_collections_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farm_members" ADD CONSTRAINT "farm_members_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "farm_members" ADD CONSTRAINT "farm_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flock_stage_history" ADD CONSTRAINT "flock_stage_history_flock_id_flocks_id_fk" FOREIGN KEY ("flock_id") REFERENCES "public"."flocks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flock_stage_history" ADD CONSTRAINT "flock_stage_history_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flock_stage_history" ADD CONSTRAINT "flock_stage_history_changed_by_user_id_users_id_fk" FOREIGN KEY ("changed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flocks" ADD CONSTRAINT "flocks_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flocks" ADD CONSTRAINT "flocks_cage_id_cages_id_fk" FOREIGN KEY ("cage_id") REFERENCES "public"."cages"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storefront_themes" ADD CONSTRAINT "storefront_themes_farm_id_farms_id_fk" FOREIGN KEY ("farm_id") REFERENCES "public"."farms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cage_access_farm_idx" ON "cage_access_logs" USING btree ("farm_id");--> statement-breakpoint
CREATE INDEX "cage_access_cage_idx" ON "cage_access_logs" USING btree ("cage_id");--> statement-breakpoint
CREATE INDEX "cages_farm_idx" ON "cages" USING btree ("farm_id");--> statement-breakpoint
CREATE INDEX "egg_collections_farm_idx" ON "egg_collections" USING btree ("farm_id");--> statement-breakpoint
CREATE INDEX "egg_collections_date_idx" ON "egg_collections" USING btree ("collected_on");--> statement-breakpoint
CREATE INDEX "expenses_farm_idx" ON "expenses" USING btree ("farm_id");--> statement-breakpoint
CREATE UNIQUE INDEX "farm_members_farm_user_idx" ON "farm_members" USING btree ("farm_id","user_id");--> statement-breakpoint
CREATE INDEX "farm_members_user_idx" ON "farm_members" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "farms_slug_idx" ON "farms" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "flock_stage_history_flock_idx" ON "flock_stage_history" USING btree ("flock_id");--> statement-breakpoint
CREATE INDEX "flocks_farm_idx" ON "flocks" USING btree ("farm_id");--> statement-breakpoint
CREATE UNIQUE INDEX "invoices_farm_number_idx" ON "invoices" USING btree ("farm_id","number");--> statement-breakpoint
CREATE INDEX "invoices_farm_idx" ON "invoices" USING btree ("farm_id");--> statement-breakpoint
CREATE INDEX "orders_farm_idx" ON "orders" USING btree ("farm_id");--> statement-breakpoint
CREATE UNIQUE INDEX "orders_paystack_ref_idx" ON "orders" USING btree ("paystack_reference");--> statement-breakpoint
CREATE INDEX "products_farm_idx" ON "products" USING btree ("farm_id");--> statement-breakpoint
CREATE INDEX "sales_farm_idx" ON "sales" USING btree ("farm_id");