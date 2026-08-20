import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const memberRoleEnum = pgEnum("member_role", ["owner", "staff"]);
export const flockStageEnum = pgEnum("flock_stage", [
  "chick",
  "grower",
  "layer",
  "broiler_ready",
  "culled",
]);
export const expenseCategoryEnum = pgEnum("expense_category", [
  "vaccine",
  "feed",
  "meds",
  "labor",
  "utilities",
  "other",
]);
export const productTypeEnum = pgEnum("product_type", [
  "eggs",
  "live_chicken",
  "processed",
  "other",
]);
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "paid",
  "void",
]);
export const saleChannelEnum = pgEnum("sale_channel", [
  "internal",
  "storefront",
]);
export const saleTypeEnum = pgEnum("sale_type", ["eggs", "chicken", "other"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending",
  "paid",
  "fulfilled",
  "cancelled",
  "failed",
]);
export const themeLayoutEnum = pgEnum("theme_layout", [
  "classic",
  "bold",
  "minimal",
]);
export const eggGradeEnum = pgEnum("egg_grade", [
  "small",
  "medium",
  "large",
  "xlarge",
  "mixed",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user id
  email: text("email").notNull(),
  name: text("name"),
  imageUrl: text("image_url"),
  ...timestamps,
});

export const farms = pgTable(
  "farms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    currency: text("currency").notNull().default("KES"),
    timezone: text("timezone").notNull().default("Africa/Nairobi"),
    paystackPublicKey: text("paystack_public_key"),
    paystackSecretKey: text("paystack_secret_key"),
    paystackSubaccount: text("paystack_subaccount"),
    storefrontPublished: boolean("storefront_published")
      .notNull()
      .default(false),
    ...timestamps,
  },
  (t) => [uniqueIndex("farms_slug_idx").on(t.slug)]
);

export const farmMembers = pgTable(
  "farm_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").notNull().default("staff"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("farm_members_farm_user_idx").on(t.farmId, t.userId),
    index("farm_members_user_idx").on(t.userId),
  ]
);

export const storefrontThemes = pgTable("storefront_themes", {
  id: uuid("id").defaultRandom().primaryKey(),
  farmId: uuid("farm_id")
    .notNull()
    .references(() => farms.id, { onDelete: "cascade" })
    .unique(),
  layout: themeLayoutEnum("layout").notNull().default("classic"),
  primaryColor: text("primary_color").notNull().default("#2d6a4f"),
  backgroundColor: text("background_color").notNull().default("#f8faf6"),
  textColor: text("text_color").notNull().default("#1a1a1a"),
  accentColor: text("accent_color").notNull().default("#d4a373"),
  fontHeading: text("font_heading").notNull().default("Fraunces"),
  fontBody: text("font_body").notNull().default("DM Sans"),
  logoUrl: text("logo_url"),
  heroImageUrl: text("hero_image_url"),
  heroHeadline: text("hero_headline").default("Farm-fresh eggs & poultry"),
  aboutBlurb: text("about_blurb"),
  contactPhone: text("contact_phone"),
  contactWhatsapp: text("contact_whatsapp"),
  contactEmail: text("contact_email"),
  shippingNotes: text("shipping_notes"),
  customCss: text("custom_css"),
  ...timestamps,
});

export const cages = pgTable(
  "cages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    capacity: integer("capacity").notNull().default(50),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [index("cages_farm_idx").on(t.farmId)]
);

export const cageAccessLogs = pgTable(
  "cage_access_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),
    cageId: uuid("cage_id")
      .notNull()
      .references(() => cages.id, { onDelete: "cascade" }),
    memberId: uuid("member_id").references(() => farmMembers.id, {
      onDelete: "set null",
    }),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    enteredAt: timestamp("entered_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    exitedAt: timestamp("exited_at", { withTimezone: true }),
    purpose: text("purpose"),
    ...timestamps,
  },
  (t) => [
    index("cage_access_farm_idx").on(t.farmId),
    index("cage_access_cage_idx").on(t.cageId),
  ]
);

export const flocks = pgTable(
  "flocks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),
    cageId: uuid("cage_id").references(() => cages.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    breed: text("breed").notNull().default("Local"),
    quantity: integer("quantity").notNull().default(0),
    acquiredAt: date("acquired_at").notNull(),
    stage: flockStageEnum("stage").notNull().default("chick"),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [index("flocks_farm_idx").on(t.farmId)]
);

export const flockStageHistory = pgTable(
  "flock_stage_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    flockId: uuid("flock_id")
      .notNull()
      .references(() => flocks.id, { onDelete: "cascade" }),
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),
    fromStage: flockStageEnum("from_stage"),
    toStage: flockStageEnum("to_stage").notNull(),
    changedAt: timestamp("changed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    changedByUserId: text("changed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    notes: text("notes"),
  },
  (t) => [index("flock_stage_history_flock_idx").on(t.flockId)]
);

export const eggCollections = pgTable(
  "egg_collections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),
    flockId: uuid("flock_id").references(() => flocks.id, {
      onDelete: "set null",
    }),
    cageId: uuid("cage_id").references(() => cages.id, {
      onDelete: "set null",
    }),
    collectedOn: date("collected_on").notNull(),
    quantity: integer("quantity").notNull(),
    brokenCount: integer("broken_count").notNull().default(0),
    grade: eggGradeEnum("grade").notNull().default("mixed"),
    notes: text("notes"),
    recordedByUserId: text("recorded_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (t) => [
    index("egg_collections_farm_idx").on(t.farmId),
    index("egg_collections_date_idx").on(t.collectedOn),
  ]
);

export const expenses = pgTable(
  "expenses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),
    category: expenseCategoryEnum("category").notNull(),
    amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
    incurredOn: date("incurred_on").notNull(),
    notes: text("notes"),
    receiptUrl: text("receipt_url"),
    recordedByUserId: text("recorded_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (t) => [index("expenses_farm_idx").on(t.farmId)]
);

export const products = pgTable(
  "products",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),
    type: productTypeEnum("type").notNull().default("eggs"),
    title: text("title").notNull(),
    description: text("description"),
    imageUrl: text("image_url"),
    price: numeric("price", { precision: 14, scale: 2 }).notNull(),
    stockQty: integer("stock_qty").notNull().default(0),
    unitLabel: text("unit_label").notNull().default("tray"),
    active: boolean("active").notNull().default(true),
    lowStockThreshold: integer("low_stock_threshold").notNull().default(5),
    ...timestamps,
  },
  (t) => [index("products_farm_idx").on(t.farmId)]
);

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),
    number: text("number").notNull(),
    counterpartyName: text("counterparty_name").notNull(),
    counterpartyEmail: text("counterparty_email"),
    counterpartyPhone: text("counterparty_phone"),
    status: invoiceStatusEnum("status").notNull().default("draft"),
    issuedOn: date("issued_on").notNull(),
    dueOn: date("due_on"),
    notes: text("notes"),
    subtotal: numeric("subtotal", { precision: 14, scale: 2 })
      .notNull()
      .default("0"),
    total: numeric("total", { precision: 14, scale: 2 }).notNull().default("0"),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("invoices_farm_number_idx").on(t.farmId, t.number),
    index("invoices_farm_idx").on(t.farmId),
  ]
);

export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).notNull(),
  lineTotal: numeric("line_total", { precision: 14, scale: 2 }).notNull(),
  saleType: saleTypeEnum("sale_type").notNull().default("eggs"),
});

export const orders = pgTable(
  "orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),
    status: orderStatusEnum("status").notNull().default("pending"),
    buyerName: text("buyer_name").notNull(),
    buyerEmail: text("buyer_email").notNull(),
    buyerPhone: text("buyer_phone"),
    subtotal: numeric("subtotal", { precision: 14, scale: 2 }).notNull(),
    total: numeric("total", { precision: 14, scale: 2 }).notNull(),
    currency: text("currency").notNull().default("KES"),
    paystackReference: text("paystack_reference"),
    paystackAccessCode: text("paystack_access_code"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    fulfilledAt: timestamp("fulfilled_at", { withTimezone: true }),
    notes: text("notes"),
    ...timestamps,
  },
  (t) => [
    index("orders_farm_idx").on(t.farmId),
    uniqueIndex("orders_paystack_ref_idx").on(t.paystackReference),
  ]
);

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).notNull(),
  lineTotal: numeric("line_total", { precision: 14, scale: 2 }).notNull(),
});

export const sales = pgTable(
  "sales",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    farmId: uuid("farm_id")
      .notNull()
      .references(() => farms.id, { onDelete: "cascade" }),
    channel: saleChannelEnum("channel").notNull().default("internal"),
    type: saleTypeEnum("type").notNull(),
    quantity: integer("quantity").notNull(),
    unitPrice: numeric("unit_price", { precision: 14, scale: 2 }).notNull(),
    total: numeric("total", { precision: 14, scale: 2 }).notNull(),
    soldOn: date("sold_on").notNull(),
    customerName: text("customer_name"),
    notes: text("notes"),
    invoiceId: uuid("invoice_id").references(() => invoices.id, {
      onDelete: "set null",
    }),
    orderId: uuid("order_id").references(() => orders.id, {
      onDelete: "set null",
    }),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    recordedByUserId: text("recorded_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (t) => [index("sales_farm_idx").on(t.farmId)]
);

export const farmsRelations = relations(farms, ({ many, one }) => ({
  members: many(farmMembers),
  cages: many(cages),
  flocks: many(flocks),
  products: many(products),
  theme: one(storefrontThemes, {
    fields: [farms.id],
    references: [storefrontThemes.farmId],
  }),
}));

export const storefrontThemesRelations = relations(
  storefrontThemes,
  ({ one }) => ({
    farm: one(farms, {
      fields: [storefrontThemes.farmId],
      references: [farms.id],
    }),
  })
);

export const farmMembersRelations = relations(farmMembers, ({ one }) => ({
  farm: one(farms, { fields: [farmMembers.farmId], references: [farms.id] }),
  user: one(users, { fields: [farmMembers.userId], references: [users.id] }),
}));

export type Farm = typeof farms.$inferSelect;
export type FarmMember = typeof farmMembers.$inferSelect;
export type Flock = typeof flocks.$inferSelect;
export type Cage = typeof cages.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Expense = typeof expenses.$inferSelect;
export type EggCollection = typeof eggCollections.$inferSelect;
export type Sale = typeof sales.$inferSelect;
export type StorefrontTheme = typeof storefrontThemes.$inferSelect;
export type MemberRole = (typeof memberRoleEnum.enumValues)[number];
export type FlockStage = (typeof flockStageEnum.enumValues)[number];
