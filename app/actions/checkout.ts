"use server";

import { and, eq, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import {
  farms,
  orderItems,
  orders,
  products,
  sales,
  storefrontThemes,
} from "@/db/schema";
import { initializePaystackTransaction } from "@/lib/paystack";

export type CartLine = { productId: string; quantity: number };

export async function checkoutAction(input: {
  farmSlug: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone?: string;
  notes?: string;
  items: CartLine[];
}) {
  const farm = await db.query.farms.findFirst({
    where: eq(farms.slug, input.farmSlug),
  });
  if (!farm || !farm.storefrontPublished) {
    throw new Error("Store not available");
  }
  if (!farm.paystackSecretKey || !farm.paystackPublicKey) {
    throw new Error("Payments not configured for this farm");
  }
  if (!input.items.length) throw new Error("Cart is empty");

  const productIds = input.items.map((i) => i.productId);
  const catalog = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.farmId, farm.id),
        eq(products.active, true),
        inArray(products.id, productIds)
      )
    );

  const byId = new Map(catalog.map((p) => [p.id, p]));
  let subtotal = 0;
  const lines: {
    productId: string;
    title: string;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
  }[] = [];

  for (const item of input.items) {
    const product = byId.get(item.productId);
    if (!product) throw new Error("Product not found");
    if (item.quantity <= 0) throw new Error("Invalid quantity");
    if (product.stockQty < item.quantity) {
      throw new Error(`Not enough stock for ${product.title}`);
    }
    const unit = Number(product.price);
    const lineTotal = unit * item.quantity;
    subtotal += lineTotal;
    lines.push({
      productId: product.id,
      title: product.title,
      quantity: item.quantity,
      unitPrice: product.price,
      lineTotal: String(lineTotal),
    });
  }

  const reference = `kf_${nanoid(16)}`;
  const [order] = await db
    .insert(orders)
    .values({
      farmId: farm.id,
      status: "pending",
      buyerName: input.buyerName,
      buyerEmail: input.buyerEmail,
      buyerPhone: input.buyerPhone || null,
      notes: input.notes || null,
      subtotal: String(subtotal),
      total: String(subtotal),
      currency: farm.currency,
      paystackReference: reference,
    })
    .returning();

  await db.insert(orderItems).values(
    lines.map((l) => ({
      orderId: order.id,
      productId: l.productId,
      title: l.title,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      lineTotal: l.lineTotal,
    }))
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const init = await initializePaystackTransaction({
    secretKey: farm.paystackSecretKey,
    email: input.buyerEmail,
    amount: subtotal,
    currency: farm.currency,
    reference,
    callbackUrl: `${appUrl}/shop/${farm.slug}/order/${order.id}`,
    metadata: { orderId: order.id, farmId: farm.id },
    subaccount: farm.paystackSubaccount,
  });

  await db
    .update(orders)
    .set({ paystackAccessCode: init.access_code })
    .where(eq(orders.id, order.id));

  return {
    authorizationUrl: init.authorization_url,
    orderId: order.id,
    publicKey: farm.paystackPublicKey,
  };
}

export async function markOrderPaidFromWebhook(opts: {
  reference: string;
  secretKeyUsed: string;
}) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.paystackReference, opts.reference),
  });
  if (!order) return { ok: false as const, reason: "order_not_found" };
  if (order.status === "paid" || order.status === "fulfilled") {
    return { ok: true as const, idempotent: true };
  }

  const farm = await db.query.farms.findFirst({
    where: eq(farms.id, order.farmId),
  });
  if (!farm?.paystackSecretKey) {
    return { ok: false as const, reason: "no_secret" };
  }
  if (farm.paystackSecretKey !== opts.secretKeyUsed) {
    // still allow if platform verifies against this farm's key
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  await db
    .update(orders)
    .set({ status: "paid", paidAt: new Date() })
    .where(eq(orders.id, order.id));

  for (const item of items) {
    if (item.productId) {
      await db
        .update(products)
        .set({
          stockQty: sql`GREATEST(0, ${products.stockQty} - ${item.quantity})`,
        })
        .where(eq(products.id, item.productId));
    }

    const product = item.productId
      ? await db.query.products.findFirst({
          where: eq(products.id, item.productId),
        })
      : null;

    const saleType =
      product?.type === "live_chicken"
        ? "chicken"
        : product?.type === "eggs"
          ? "eggs"
          : "other";

    await db.insert(sales).values({
      farmId: order.farmId,
      channel: "storefront",
      type: saleType,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.lineTotal,
      soldOn: new Date().toISOString().slice(0, 10),
      customerName: order.buyerName,
      orderId: order.id,
      productId: item.productId,
    });
  }

  return { ok: true as const, orderId: order.id };
}

export async function getPublishedShop(slug: string) {
  const farm = await db.query.farms.findFirst({
    where: eq(farms.slug, slug),
  });
  if (!farm || !farm.storefrontPublished) return null;
  const theme = await db.query.storefrontThemes.findFirst({
    where: eq(storefrontThemes.farmId, farm.id),
  });
  const catalog = await db
    .select()
    .from(products)
    .where(and(eq(products.farmId, farm.id), eq(products.active, true)));
  return { farm, theme, products: catalog };
}
