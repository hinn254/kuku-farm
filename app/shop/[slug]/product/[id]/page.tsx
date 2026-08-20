import { notFound } from "next/navigation";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { products } from "@/db/schema";
import { getPublishedShop } from "@/app/actions/checkout";
import { CartProvider } from "@/components/shop/cart-context";
import { AddToCartButton, ShopHeader } from "@/components/shop/shop-ui";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;
  const shop = await getPublishedShop(slug);
  if (!shop) notFound();

  const product = await db.query.products.findFirst({
    where: and(
      eq(products.id, id),
      eq(products.farmId, shop.farm.id),
      eq(products.active, true)
    ),
  });
  if (!product) notFound();

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
        <div className="mx-auto grid max-w-5xl gap-10 px-6 py-10 md:grid-cols-2 md:px-10">
          <div className="aspect-square overflow-hidden rounded-2xl bg-black/5">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div>
            <Link href={`/shop/${slug}`} className="text-sm underline opacity-70">
              Back to shop
            </Link>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl">
              {product.title}
            </h1>
            {product.description && (
              <p className="mt-4 leading-relaxed opacity-85">
                {product.description}
              </p>
            )}
            <p className="mt-4 text-sm opacity-70">
              {product.stockQty} {product.unitLabel} available
            </p>
            <div className="mt-6">
              <AddToCartButton
                product={product}
                primary={primary}
                currency={shop.farm.currency}
              />
            </div>
          </div>
        </div>
      </div>
    </CartProvider>
  );
}
