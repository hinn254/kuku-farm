import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { farms, orderItems, orders } from "@/db/schema";

export async function lookupBuyerOrders(opts: {
  slug: string;
  email: string;
  reference?: string;
}) {
  const farm = await db.query.farms.findFirst({
    where: eq(farms.slug, opts.slug),
  });
  if (!farm || !farm.storefrontPublished) return null;

  const email = opts.email.trim().toLowerCase();
  if (!email) return { farm, orders: [] as Array<{ order: typeof orders.$inferSelect; items: (typeof orderItems.$inferSelect)[] }> };

  let found = await db
    .select()
    .from(orders)
    .where(and(eq(orders.farmId, farm.id), eq(orders.buyerEmail, email)));

  if (opts.reference?.trim()) {
    const ref = opts.reference.trim();
    found = found.filter(
      (o) => o.paystackReference === ref || o.id === ref
    );
  }

  const withItems = await Promise.all(
    found.map(async (o) => ({
      order: o,
      items: await db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, o.id)),
    }))
  );

  return { farm, orders: withItems };
}
