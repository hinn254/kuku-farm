import Link from "next/link";
import { notFound } from "next/navigation";
import { lookupBuyerOrders } from "@/lib/buyer-orders";
import { formatMoney } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function BuyerOrdersPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ email?: string; reference?: string }>;
}) {
  const { slug } = await params;
  const q = await searchParams;
  const result = await lookupBuyerOrders({
    slug,
    email: q.email ?? "",
    reference: q.reference,
  });
  if (!result) notFound();

  const { farm, orders } = result;
  const searched = Boolean(q.email);

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-6 py-12">
      <Link href={`/shop/${slug}`} className="text-sm underline opacity-70">
        Back to {farm.name}
      </Link>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl">
        Your orders
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Look up guest orders with the email used at checkout. Optionally filter
        by Paystack reference or order id.
      </p>

      <form className="mt-6 grid gap-3 rounded-xl border border-border bg-white p-5 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={q.email ?? ""}
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="reference">Reference (optional)</Label>
          <Input
            id="reference"
            name="reference"
            defaultValue={q.reference ?? ""}
            placeholder="kf_… or order id"
          />
        </div>
        <Button type="submit" className="bg-[#2d6a4f] hover:bg-[#245a42]">
          Find orders
        </Button>
      </form>

      <div className="mt-8 space-y-4">
        {!searched && (
          <p className="text-sm text-muted-foreground">Enter your email to search.</p>
        )}
        {searched && orders.length === 0 && (
          <p className="text-sm text-muted-foreground">No orders found for that email.</p>
        )}
        {orders.map(({ order, items }) => (
          <article
            key={order.id}
            className="rounded-xl border border-border bg-white p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium">{order.buyerName}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {order.paystackReference || order.id}
                </p>
              </div>
              <Badge variant="secondary" className="capitalize">
                {order.status}
              </Badge>
            </div>
            <ul className="mt-3 space-y-1 text-sm">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between">
                  <span>
                    {item.title} × {item.quantity}
                  </span>
                  <span>{formatMoney(item.lineTotal, order.currency)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-right font-semibold">
              {formatMoney(order.total, order.currency)}
            </p>
            <Link
              href={`/shop/${slug}/order/${order.id}`}
              className="mt-2 inline-block text-sm underline"
            >
              View confirmation
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
