import { notFound } from "next/navigation";
import { getPublishedShop } from "@/app/actions/checkout";
import { CartProvider } from "@/components/shop/cart-context";
import { CartCheckout } from "@/components/shop/cart-checkout";
import { ShopHeader } from "@/components/shop/shop-ui";

export default async function CartPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const shop = await getPublishedShop(slug);
  if (!shop) notFound();

  const primary = shop.theme?.primaryColor ?? "#2d6a4f";
  const bg = shop.theme?.backgroundColor ?? "#f8faf6";
  const text = shop.theme?.textColor ?? "#1a1a1a";

  return (
    <CartProvider slug={slug}>
      <div className="min-h-screen" style={{ backgroundColor: bg, color: text }}>
        <ShopHeader
          slug={slug}
          farmName={shop.farm.name}
          logoUrl={shop.theme?.logoUrl}
          primary={primary}
        />
        <div className="mx-auto max-w-5xl px-6 py-10 md:px-10">
          <h1 className="mb-8 font-[family-name:var(--font-display)] text-3xl">
            Your cart
          </h1>
          <CartCheckout
            slug={slug}
            currency={shop.farm.currency}
            primary={primary}
          />
        </div>
      </div>
    </CartProvider>
  );
}
