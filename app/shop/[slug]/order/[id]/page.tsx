import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/lib/db";
import { farms, orderItems, orders } from "@/db/schema";
import { formatMoney } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const farm = await db.query.farms.findFirst({ where: eq(farms.slug, slug) });
  if (!farm) notFound();

  const order = await db.query.orders.findFirst({
    where: and(eq(orders.id, id), eq(orders.farmId, farm.id)),
  });
  if (!order) notFound();

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6 py-16">
      <p className="text-sm uppercase tracking-wide text-muted-foreground">
        {farm.name}
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">
        Order received
      </h1>
      <div className="mt-4 flex items-center gap-2">
        <Badge variant="secondary" className="capitalize">
          {order.status}
        </Badge>
        {order.paystackReference && (
          <span className="font-mono text-xs text-muted-foreground">
            {order.paystackReference}
          </span>
        )}
      </div>
      <p className="mt-4 text-sm text-muted-foreground">
        {order.status === "pending"
          ? "If you just paid, confirmation can take a few seconds via Paystack webhook."
          : "Thanks — the farm will fulfill your order shortly."}
      </p>
      <ul className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
        {items.map((item) => (
          <li key={item.id} className="flex justify-between">
            <span>
              {item.title} × {item.quantity}
            </span>
            <span>{formatMoney(item.lineTotal, order.currency)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-right font-semibold">
        Total {formatMoney(order.total, order.currency)}
      </p>
      <Link href={`/shop/${slug}`} className="mt-8 text-sm underline">
        Back to shop
      </Link>
    </div>
  );
}
