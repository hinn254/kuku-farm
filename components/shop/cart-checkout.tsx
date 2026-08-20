"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { useCart } from "@/components/shop/cart-context";
import { checkoutAction } from "@/app/actions/checkout";
import { formatMoney } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CartCheckout({
  slug,
  currency,
  primary,
}: {
  slug: string;
  currency: string;
  primary: string;
}) {
  const { items, setQty, removeItem, total, clear } = useCart();
  const [pending, startTransition] = useTransition();

  if (items.length === 0) {
    return (
      <p className="text-muted-foreground">Your cart is empty.</p>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex items-center justify-between gap-4 border-b border-black/10 pb-4"
          >
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="text-sm opacity-70">
                {formatMoney(item.price, currency)} / {item.unitLabel}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) =>
                  setQty(item.productId, Number(e.target.value) || 1)
                }
                className="h-8 w-16 rounded border border-black/15 px-2 text-sm"
              />
              <button
                type="button"
                className="text-sm underline opacity-70"
                onClick={() => removeItem(item.productId)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        <p className="text-lg font-semibold">
          Total {formatMoney(total, currency)}
        </p>
      </div>

      <form
        className="space-y-3 rounded-2xl border border-black/10 bg-white/70 p-5"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(async () => {
            try {
              const result = await checkoutAction({
                farmSlug: slug,
                buyerName: String(fd.get("buyerName") || ""),
                buyerEmail: String(fd.get("buyerEmail") || ""),
                buyerPhone: String(fd.get("buyerPhone") || ""),
                notes: String(fd.get("notes") || ""),
                items: items.map((i) => ({
                  productId: i.productId,
                  quantity: i.quantity,
                })),
              });
              clear();
              toast.success("Redirecting to Paystack…");
              window.location.href = result.authorizationUrl;
            } catch (err) {
              toast.error(
                err instanceof Error ? err.message : "Checkout failed"
              );
            }
          });
        }}
      >
        <h2 className="font-[family-name:var(--font-display)] text-xl">
          Checkout
        </h2>
        <div className="space-y-1">
          <Label htmlFor="buyerName">Full name</Label>
          <Input id="buyerName" name="buyerName" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="buyerEmail">Email</Label>
          <Input id="buyerEmail" name="buyerEmail" type="email" required />
        </div>
        <div className="space-y-1">
          <Label htmlFor="buyerPhone">Phone</Label>
          <Input id="buyerPhone" name="buyerPhone" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" rows={2} />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          style={{ backgroundColor: primary }}
        >
          {pending ? "Redirecting…" : "Pay with Paystack"}
        </button>
      </form>
    </div>
  );
}
