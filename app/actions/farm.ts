"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { and, eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import {
  cages,
  cageAccessLogs,
  eggCollections,
  expenses,
  farmMembers,
  farms,
  flockStageHistory,
  flocks,
  invoiceItems,
  invoices,
  products,
  sales,
  storefrontThemes,
  users,
} from "@/db/schema";
import { requireUser, requireFarmAccess } from "@/lib/auth";
import { ACTIVE_FARM_COOKIE } from "@/lib/farm";
import { slugify } from "@/lib/constants";
import { saveUpload } from "@/lib/uploads";

function formString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function formNumber(formData: FormData, key: string) {
  return Number(formData.get(key) ?? 0);
}

export async function createFarmAction(formData: FormData) {
  const user = await requireUser();
  const name = formString(formData, "name");
  const currency = formString(formData, "currency") || "KES";
  const timezone = formString(formData, "timezone") || "Africa/Nairobi";
  if (!name) throw new Error("Farm name is required");

  let slug = slugify(name) || `farm-${nanoid(6)}`;
  const existing = await db.query.farms.findFirst({
    where: eq(farms.slug, slug),
  });
  if (existing) slug = `${slug}-${nanoid(4)}`;

  const [farm] = await db
    .insert(farms)
    .values({ name, slug, currency, timezone })
    .returning();

  await db.insert(farmMembers).values({
    farmId: farm.id,
    userId: user.id,
    role: "owner",
  });

  await db.insert(storefrontThemes).values({
    farmId: farm.id,
    heroHeadline: `Welcome to ${name}`,
    aboutBlurb: `Fresh eggs and poultry from ${name}.`,
  });

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_FARM_COOKIE, farm.id, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
  });

  redirect("/app");
}

export async function switchFarmAction(formData: FormData) {
  const farmId = formString(formData, "farmId");
  await requireFarmAccess(farmId);
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_FARM_COOKIE, farmId, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
  });
  redirect("/app");
}

export async function inviteMemberAction(formData: FormData) {
  const farmId = formString(formData, "farmId");
  await requireFarmAccess(farmId, ["owner"]);
  const email = formString(formData, "email").toLowerCase();
  const role = formString(formData, "role") === "owner" ? "owner" : "staff";
  if (!email) throw new Error("Email is required");

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (!existingUser) {
    throw new Error(
      "User must sign up first with that email, then you can add them."
    );
  }

  const already = await db.query.farmMembers.findFirst({
    where: and(
      eq(farmMembers.farmId, farmId),
      eq(farmMembers.userId, existingUser.id)
    ),
  });
  if (already) throw new Error("Already a member");

  await db.insert(farmMembers).values({
    farmId,
    userId: existingUser.id,
    role,
  });
  revalidatePath("/app/settings/members");
}

export async function updateMemberRoleAction(formData: FormData) {
  const farmId = formString(formData, "farmId");
  const memberId = formString(formData, "memberId");
  const user = await requireUser();
  await requireFarmAccess(farmId, ["owner"]);
  const role = formString(formData, "role") === "owner" ? "owner" : "staff";

  const target = await db.query.farmMembers.findFirst({
    where: and(eq(farmMembers.id, memberId), eq(farmMembers.farmId, farmId)),
  });
  if (!target) throw new Error("Member not found");
  if (target.userId === user.id && role === "staff") {
    throw new Error("You cannot demote yourself");
  }

  await db
    .update(farmMembers)
    .set({ role })
    .where(eq(farmMembers.id, memberId));
  revalidatePath("/app/settings/members");
}

export async function removeMemberAction(formData: FormData) {
  const farmId = formString(formData, "farmId");
  const memberId = formString(formData, "memberId");
  const user = await requireUser();
  await requireFarmAccess(farmId, ["owner"]);

  const target = await db.query.farmMembers.findFirst({
    where: and(eq(farmMembers.id, memberId), eq(farmMembers.farmId, farmId)),
  });
  if (!target) throw new Error("Member not found");
  if (target.userId === user.id) {
    throw new Error("You cannot remove yourself");
  }

  const owners = await db
    .select()
    .from(farmMembers)
    .where(
      and(eq(farmMembers.farmId, farmId), eq(farmMembers.role, "owner"))
    );
  if (target.role === "owner" && owners.length <= 1) {
    throw new Error("Cannot remove the last owner");
  }

  await db.delete(farmMembers).where(eq(farmMembers.id, memberId));
  revalidatePath("/app/settings/members");
}

export async function updateFarmSettingsAction(formData: FormData) {
  const farmId = formString(formData, "farmId");
  await requireFarmAccess(farmId, ["owner"]);
  const name = formString(formData, "name");
  let slug = slugify(formString(formData, "slug") || name);
  const timezone = formString(formData, "timezone") || "Africa/Nairobi";
  const currency = formString(formData, "currency") || "KES";

  if (!name || !slug) throw new Error("Name and slug are required");

  const clash = await db.query.farms.findFirst({
    where: eq(farms.slug, slug),
  });
  if (clash && clash.id !== farmId) {
    slug = `${slug}-${nanoid(4)}`;
  }

  await db
    .update(farms)
    .set({ name, slug, timezone, currency })
    .where(eq(farms.id, farmId));

  revalidatePath("/app/settings/farm");
  revalidatePath("/app");
}

export async function createCageAction(formData: FormData) {
  const farmId = formString(formData, "farmId");
  await requireFarmAccess(farmId);
  await db.insert(cages).values({
    farmId,
    name: formString(formData, "name"),
    capacity: formNumber(formData, "capacity") || 50,
    notes: formString(formData, "notes") || null,
  });
  revalidatePath("/app/cages");
}

export async function updateCageAction(formData: FormData) {
  const farmId = formString(formData, "farmId");
  const cageId = formString(formData, "cageId");
  await requireFarmAccess(farmId);
  await db
    .update(cages)
    .set({
      name: formString(formData, "name"),
      capacity: formNumber(formData, "capacity") || 50,
      notes: formString(formData, "notes") || null,
    })
    .where(and(eq(cages.id, cageId), eq(cages.farmId, farmId)));
  revalidatePath("/app/cages");
}

export async function deleteCageAction(formData: FormData) {
  const farmId = formString(formData, "farmId");
  const cageId = formString(formData, "cageId");
  await requireFarmAccess(farmId);
  await db
    .delete(cages)
    .where(and(eq(cages.id, cageId), eq(cages.farmId, farmId)));
  revalidatePath("/app/cages");
  revalidatePath("/app/flocks");
}

export async function logCageAccessAction(formData: FormData) {
  const farmId = formString(formData, "farmId");
  const { membership } = await requireFarmAccess(farmId);
  const user = await requireUser();
  await db.insert(cageAccessLogs).values({
    farmId,
    cageId: formString(formData, "cageId"),
    memberId: membership.id,
    userId: user.id,
    purpose: formString(formData, "purpose") || null,
    exitedAt: formString(formData, "exited") === "1" ? new Date() : null,
  });
  revalidatePath("/app/cages");
}

export async function createFlockAction(formData: FormData) {
  const farmId = formString(formData, "farmId");
  const user = await requireUser();
  await requireFarmAccess(farmId);
  const stage = (formString(formData, "stage") || "chick") as
    | "chick"
    | "grower"
    | "layer"
    | "broiler_ready"
    | "culled";
  const cageId = formString(formData, "cageId") || null;

  const [flock] = await db
    .insert(flocks)
    .values({
      farmId,
      cageId,
      name: formString(formData, "name"),
      breed: formString(formData, "breed") || "Local",
      quantity: formNumber(formData, "quantity") || 0,
      acquiredAt:
        formString(formData, "acquiredAt") ||
        new Date().toISOString().slice(0, 10),
      stage,
      notes: formString(formData, "notes") || null,
    })
    .returning();

  await db.insert(flockStageHistory).values({
    flockId: flock.id,
    farmId,
    fromStage: null,
    toStage: stage,
    changedByUserId: user.id,
  });

  revalidatePath("/app/flocks");
  revalidatePath("/app");
}

export async function updateFlockAction(formData: FormData) {
  const farmId = formString(formData, "farmId");
  const flockId = formString(formData, "flockId");
  await requireFarmAccess(farmId);
  await db
    .update(flocks)
    .set({
      name: formString(formData, "name"),
      breed: formString(formData, "breed") || "Local",
      quantity: formNumber(formData, "quantity") || 0,
      cageId: formString(formData, "cageId") || null,
      acquiredAt:
        formString(formData, "acquiredAt") ||
        new Date().toISOString().slice(0, 10),
      notes: formString(formData, "notes") || null,
    })
    .where(and(eq(flocks.id, flockId), eq(flocks.farmId, farmId)));
  revalidatePath("/app/flocks");
  revalidatePath("/app");
}

export async function deleteFlockAction(formData: FormData) {
  const farmId = formString(formData, "farmId");
  const flockId = formString(formData, "flockId");
  await requireFarmAccess(farmId);
  await db
    .delete(flocks)
    .where(and(eq(flocks.id, flockId), eq(flocks.farmId, farmId)));
  revalidatePath("/app/flocks");
  revalidatePath("/app");
}

export async function updateFlockStageAction(formData: FormData) {
  const farmId = formString(formData, "farmId");
  const flockId = formString(formData, "flockId");
  const user = await requireUser();
  await requireFarmAccess(farmId);
  const toStage = formString(formData, "stage") as
    | "chick"
    | "grower"
    | "layer"
    | "broiler_ready"
    | "culled";

  const flock = await db.query.flocks.findFirst({
    where: and(eq(flocks.id, flockId), eq(flocks.farmId, farmId)),
  });
  if (!flock) throw new Error("Flock not found");

  await db
    .update(flocks)
    .set({ stage: toStage })
    .where(eq(flocks.id, flockId));

  await db.insert(flockStageHistory).values({
    flockId,
    farmId,
    fromStage: flock.stage,
    toStage,
    changedByUserId: user.id,
    notes: formString(formData, "notes") || null,
  });

  revalidatePath("/app/flocks");
  revalidatePath("/app");
}

export async function deleteProductAction(formData: FormData) {
  const farmId = formString(formData, "farmId");
  const productId = formString(formData, "productId");
  await requireFarmAccess(farmId);
  await db
    .delete(products)
    .where(and(eq(products.id, productId), eq(products.farmId, farmId)));
  revalidatePath("/app/store");
}

export async function toggleProductActiveAction(formData: FormData) {
  const farmId = formString(formData, "farmId");
  const productId = formString(formData, "productId");
  await requireFarmAccess(farmId);
  const product = await db.query.products.findFirst({
    where: and(eq(products.id, productId), eq(products.farmId, farmId)),
  });
  if (!product) throw new Error("Product not found");
  await db
    .update(products)
    .set({ active: !product.active })
    .where(eq(products.id, productId));
  revalidatePath("/app/store");
}

export async function logEggsAction(formData: FormData) {
  const farmId = formString(formData, "farmId");
  const user = await requireUser();
  await requireFarmAccess(farmId);
  const quantity = formNumber(formData, "quantity");
  const broken = formNumber(formData, "brokenCount");

  await db.insert(eggCollections).values({
    farmId,
    flockId: formString(formData, "flockId") || null,
    cageId: formString(formData, "cageId") || null,
    collectedOn:
      formString(formData, "collectedOn") ||
      new Date().toISOString().slice(0, 10),
    quantity,
    brokenCount: broken,
    grade: (formString(formData, "grade") || "mixed") as
      | "small"
      | "medium"
      | "large"
      | "xlarge"
      | "mixed",
    notes: formString(formData, "notes") || null,
    recordedByUserId: user.id,
  });

  // Feed egg product stock with usable eggs
  const usable = Math.max(0, quantity - broken);
  if (usable > 0) {
    const eggProduct = await db.query.products.findFirst({
      where: and(eq(products.farmId, farmId), eq(products.type, "eggs")),
    });
    if (eggProduct) {
      await db
        .update(products)
        .set({ stockQty: sql`${products.stockQty} + ${usable}` })
        .where(eq(products.id, eggProduct.id));
    }
  }

  revalidatePath("/app/eggs");
  revalidatePath("/app");
  revalidatePath("/app/store");
}

export async function createExpenseAction(formData: FormData) {
  const farmId = formString(formData, "farmId");
  const user = await requireUser();
  await requireFarmAccess(farmId);

  let receiptUrl: string | null = null;
  const file = formData.get("receipt");
  if (file instanceof File && file.size > 0) {
    receiptUrl = await saveUpload(file, "receipts");
  }

  await db.insert(expenses).values({
    farmId,
    category: (formString(formData, "category") || "other") as
      | "vaccine"
      | "feed"
      | "meds"
      | "labor"
      | "utilities"
      | "other",
    amount: String(formNumber(formData, "amount")),
    incurredOn:
      formString(formData, "incurredOn") ||
      new Date().toISOString().slice(0, 10),
    notes: formString(formData, "notes") || null,
    receiptUrl,
    recordedByUserId: user.id,
  });

  revalidatePath("/app/expenses");
  revalidatePath("/app");
}

export async function createSaleAction(formData: FormData) {
  const farmId = formString(formData, "farmId");
  const user = await requireUser();
  await requireFarmAccess(farmId);
  const quantity = formNumber(formData, "quantity");
  const unitPrice = formNumber(formData, "unitPrice");
  const type = (formString(formData, "type") || "eggs") as
    | "eggs"
    | "chicken"
    | "other";
  const productId = formString(formData, "productId") || null;
  const total = quantity * unitPrice;

  await db.insert(sales).values({
    farmId,
    channel: "internal",
    type,
    quantity,
    unitPrice: String(unitPrice),
    total: String(total),
    soldOn:
      formString(formData, "soldOn") || new Date().toISOString().slice(0, 10),
    customerName: formString(formData, "customerName") || null,
    notes: formString(formData, "notes") || null,
    productId,
    recordedByUserId: user.id,
  });

  if (productId) {
    await db
      .update(products)
      .set({
        stockQty: sql`GREATEST(0, ${products.stockQty} - ${quantity})`,
      })
      .where(and(eq(products.id, productId), eq(products.farmId, farmId)));
  }

  if (type === "chicken") {
    const flockId = formString(formData, "flockId");
    if (flockId) {
      await db
        .update(flocks)
        .set({
          quantity: sql`GREATEST(0, ${flocks.quantity} - ${quantity})`,
        })
        .where(and(eq(flocks.id, flockId), eq(flocks.farmId, farmId)));
    }
  }

  revalidatePath("/app/sales");
  revalidatePath("/app");
  revalidatePath("/app/store");
}

export async function createInvoiceAction(formData: FormData) {
  const farmId = formString(formData, "farmId");
  await requireFarmAccess(farmId);

  const count = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(invoices)
    .where(eq(invoices.farmId, farmId));
  const number = `INV-${String((count[0]?.c ?? 0) + 1).padStart(4, "0")}`;

  let lines: {
    description: string;
    quantity: number;
    unitPrice: number;
    saleType: "eggs" | "chicken" | "other";
  }[] = [];

  const linesJson = formString(formData, "linesJson");
  if (linesJson) {
    try {
      const parsed = JSON.parse(linesJson) as typeof lines;
      lines = parsed.filter(
        (l) => l.description && l.quantity > 0 && l.unitPrice >= 0
      );
    } catch {
      throw new Error("Invalid line items");
    }
  } else {
    lines = [
      {
        description: formString(formData, "description"),
        quantity: formNumber(formData, "quantity") || 1,
        unitPrice: formNumber(formData, "unitPrice"),
        saleType: (formString(formData, "saleType") || "eggs") as
          | "eggs"
          | "chicken"
          | "other",
      },
    ];
  }

  if (lines.length === 0) throw new Error("Add at least one line item");

  const total = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const status = (formString(formData, "status") || "draft") as
    | "draft"
    | "sent"
    | "paid"
    | "void";

  const [invoice] = await db
    .insert(invoices)
    .values({
      farmId,
      number,
      counterpartyName: formString(formData, "counterpartyName"),
      counterpartyEmail: formString(formData, "counterpartyEmail") || null,
      counterpartyPhone: formString(formData, "counterpartyPhone") || null,
      status,
      issuedOn:
        formString(formData, "issuedOn") ||
        new Date().toISOString().slice(0, 10),
      dueOn: formString(formData, "dueOn") || null,
      notes: formString(formData, "notes") || null,
      subtotal: String(total),
      total: String(total),
    })
    .returning();

  await db.insert(invoiceItems).values(
    lines.map((l) => ({
      invoiceId: invoice.id,
      description: l.description,
      quantity: l.quantity,
      unitPrice: String(l.unitPrice),
      lineTotal: String(l.quantity * l.unitPrice),
      saleType: l.saleType || "eggs",
    }))
  );

  if (invoice.status === "paid") {
    const user = await requireUser();
    for (const l of lines) {
      await db.insert(sales).values({
        farmId,
        channel: "internal",
        type: l.saleType || "eggs",
        quantity: l.quantity,
        unitPrice: String(l.unitPrice),
        total: String(l.quantity * l.unitPrice),
        soldOn: invoice.issuedOn,
        customerName: invoice.counterpartyName,
        invoiceId: invoice.id,
        recordedByUserId: user.id,
      });
    }
  }

  revalidatePath("/app/invoices");
  redirect(`/app/invoices/${invoice.id}`);
}

export async function updateInvoiceStatusAction(formData: FormData) {
  const farmId = formString(formData, "farmId");
  const invoiceId = formString(formData, "invoiceId");
  await requireFarmAccess(farmId);
  const status = formString(formData, "status") as
    | "draft"
    | "sent"
    | "paid"
    | "void";

  const invoice = await db.query.invoices.findFirst({
    where: and(eq(invoices.id, invoiceId), eq(invoices.farmId, farmId)),
  });
  if (!invoice) throw new Error("Invoice not found");

  await db.update(invoices).set({ status }).where(eq(invoices.id, invoiceId));

  if (status === "paid" && invoice.status !== "paid") {
    const items = await db.query.invoiceItems.findMany({
      where: eq(invoiceItems.invoiceId, invoiceId),
    });
    const user = await requireUser();
    for (const item of items) {
      await db.insert(sales).values({
        farmId,
        channel: "internal",
        type: item.saleType,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.lineTotal,
        soldOn: invoice.issuedOn,
        customerName: invoice.counterpartyName,
        invoiceId,
        recordedByUserId: user.id,
      });
    }
  }

  revalidatePath(`/app/invoices/${invoiceId}`);
  revalidatePath("/app/invoices");
  revalidatePath("/app/sales");
}

export async function upsertProductAction(formData: FormData) {
  const farmId = formString(formData, "farmId");
  await requireFarmAccess(farmId);
  const productId = formString(formData, "productId");

  let imageUrl: string | null = formString(formData, "existingImage") || null;
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    imageUrl = await saveUpload(file, "products");
  }

  const values = {
    farmId,
    type: (formString(formData, "type") || "eggs") as
      | "eggs"
      | "live_chicken"
      | "processed"
      | "other",
    title: formString(formData, "title"),
    description: formString(formData, "description") || null,
    imageUrl,
    price: String(formNumber(formData, "price")),
    stockQty: formNumber(formData, "stockQty"),
    unitLabel: formString(formData, "unitLabel") || "tray",
    active: formString(formData, "active") !== "0",
    lowStockThreshold: formNumber(formData, "lowStockThreshold") || 5,
  };

  if (productId) {
    await db
      .update(products)
      .set(values)
      .where(and(eq(products.id, productId), eq(products.farmId, farmId)));
  } else {
    await db.insert(products).values(values);
  }

  revalidatePath("/app/store");
}

export async function updateStoreSettingsAction(formData: FormData) {
  const farmId = formString(formData, "farmId");
  await requireFarmAccess(farmId, ["owner"]);

  let logoUrl: string | null = formString(formData, "existingLogo") || null;
  let heroImageUrl: string | null =
    formString(formData, "existingHero") || null;
  const logo = formData.get("logo");
  const hero = formData.get("hero");
  if (logo instanceof File && logo.size > 0) {
    logoUrl = await saveUpload(logo, "storefront");
  }
  if (hero instanceof File && hero.size > 0) {
    heroImageUrl = await saveUpload(hero, "storefront");
  }

  await db
    .update(farms)
    .set({
      paystackPublicKey: formString(formData, "paystackPublicKey") || null,
      paystackSecretKey: formString(formData, "paystackSecretKey") || null,
      paystackSubaccount: formString(formData, "paystackSubaccount") || null,
      storefrontPublished: formString(formData, "storefrontPublished") === "1",
      currency: formString(formData, "currency") || "KES",
    })
    .where(eq(farms.id, farmId));

  await db
    .update(storefrontThemes)
    .set({
      layout: (formString(formData, "layout") || "classic") as
        | "classic"
        | "bold"
        | "minimal",
      primaryColor: formString(formData, "primaryColor") || "#2d6a4f",
      backgroundColor: formString(formData, "backgroundColor") || "#f8faf6",
      textColor: formString(formData, "textColor") || "#1a1a1a",
      accentColor: formString(formData, "accentColor") || "#d4a373",
      fontHeading: formString(formData, "fontHeading") || "Fraunces",
      fontBody: formString(formData, "fontBody") || "DM Sans",
      logoUrl,
      heroImageUrl,
      heroHeadline: formString(formData, "heroHeadline") || null,
      aboutBlurb: formString(formData, "aboutBlurb") || null,
      contactPhone: formString(formData, "contactPhone") || null,
      contactWhatsapp: formString(formData, "contactWhatsapp") || null,
      contactEmail: formString(formData, "contactEmail") || null,
      shippingNotes: formString(formData, "shippingNotes") || null,
      customCss: formString(formData, "customCss") || null,
    })
    .where(eq(storefrontThemes.farmId, farmId));

  const farmRow = await db.query.farms.findFirst({
    where: eq(farms.id, farmId),
  });
  revalidatePath("/app/store");
  if (farmRow?.slug) revalidatePath(`/shop/${farmRow.slug}`);
}

export async function fulfillOrderAction(formData: FormData) {
  const farmId = formString(formData, "farmId");
  const orderId = formString(formData, "orderId");
  await requireFarmAccess(farmId);
  const { orders } = await import("@/db/schema");
  await db
    .update(orders)
    .set({ status: "fulfilled", fulfilledAt: new Date() })
    .where(and(eq(orders.id, orderId), eq(orders.farmId, farmId)));
  revalidatePath("/app/orders");
}
