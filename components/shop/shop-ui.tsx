"use client";

import Link from "next/link";
import { toast } from "sonner";
import { useCart } from "@/components/shop/cart-context";
import { formatMoney } from "@/lib/constants";

export function ShopHeader({
  slug,
  farmName,
  logoUrl,
  primary,
}: {
  slug: string;
  farmName: string;
  logoUrl?: string | null;
  primary: string;
}) {
  const { items } = useCart();
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <header className="flex items-center justify-between gap-4 px-6 py-4 md:px-10">
      <Link href={`/shop/${slug}`} className="flex items-center gap-3">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
        ) : null}
        <span
          className="text-2xl tracking-tight"
          style={{ color: primary, fontFamily: "var(--shop-heading-font, Georgia, serif)" }}
        >
          {farmName}
        </span>
      </Link>
      <div className="flex items-center gap-3">
        <Link href={`/shop/${slug}/orders`} className="text-sm underline opacity-80">
          Orders
        </Link>
        <Link
          href={`/shop/${slug}/cart`}
          className="rounded-full px-4 py-2 text-sm font-medium text-white"
          style={{ backgroundColor: primary }}
        >
          Cart ({count})
        </Link>
      </div>
    </header>
  );
}

export function AddToCartButton({
  product,
  primary,
  currency,
}: {
  product: {
    id: string;
    title: string;
    price: string | number;
    unitLabel: string;
    imageUrl?: string | null;
  };
  primary: string;
  currency: string;
}) {
  const { addItem } = useCart();
  return (
    <button
      type="button"
      onClick={() => {
        addItem({
          productId: product.id,
          title: product.title,
          price: Number(product.price),
          unitLabel: product.unitLabel,
          imageUrl: product.imageUrl,
        });
        toast.success(`Added ${product.title} to cart`);
      }}
      className="rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
      style={{ backgroundColor: primary }}
    >
      Add · {formatMoney(product.price, currency)}
    </button>
  );
}
