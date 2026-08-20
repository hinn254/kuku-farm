import { notFound } from "next/navigation";
import Link from "next/link";
import { getPublishedShop } from "@/app/actions/checkout";
import { CartProvider } from "@/components/shop/cart-context";
import { AddToCartButton, ShopHeader } from "@/components/shop/shop-ui";
import { formatMoney } from "@/lib/constants";
import { googleFontsHref } from "@/lib/shop-fonts";

export default async function ShopHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const shop = await getPublishedShop(slug);
  if (!shop) notFound();

  const { farm, theme, products } = shop;
  const primary = theme?.primaryColor ?? "#2d6a4f";
  const bg = theme?.backgroundColor ?? "#f8faf6";
  const text = theme?.textColor ?? "#1a1a1a";
  const accent = theme?.accentColor ?? "#d4a373";
  const layout = theme?.layout ?? "classic";
  const fontHeading = theme?.fontHeading ?? "Fraunces";
  const fontBody = theme?.fontBody ?? "DM Sans";

  return (
    <CartProvider slug={slug}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href={googleFontsHref(fontHeading, fontBody)} rel="stylesheet" />
      <div
        className="shop-root min-h-screen"
        style={{
          backgroundColor: bg,
          color: text,
          fontFamily: `"${fontBody}", system-ui, sans-serif`,
          ["--shop-primary" as string]: primary,
          ["--shop-accent" as string]: accent,
          ["--shop-heading-font" as string]: `"${fontHeading}", Georgia, serif`,
        }}
      >
        {theme?.customCss ? (
          <style dangerouslySetInnerHTML={{ __html: theme.customCss }} />
        ) : null}
        <ShopHeader
          slug={slug}
          farmName={farm.name}
          logoUrl={theme?.logoUrl}
          primary={primary}
        />

        <section
          className={`shop-hero relative min-h-[70vh] overflow-hidden ${
            layout === "bold" ? "md:min-h-[85vh]" : ""
          }`}
        >
          {theme?.heroImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={theme.heroImageUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)`,
              }}
            />
          )}
          <div className="absolute inset-0 bg-black/35" />
          <div
            className={`relative z-10 flex min-h-[70vh] flex-col justify-end px-6 pb-16 pt-24 text-white md:px-12 ${
              layout === "minimal" ? "items-center text-center" : ""
            } ${layout === "bold" ? "md:min-h-[85vh] md:pb-24" : ""}`}
          >
            <h1
              className={`max-w-3xl tracking-tight ${
                layout === "bold"
                  ? "text-5xl md:text-7xl"
                  : "text-4xl md:text-6xl"
              }`}
              style={{ fontFamily: "var(--shop-heading-font)" }}
            >
              {farm.name}
            </h1>
            <p className="mt-4 max-w-xl text-lg text-white/90">
              {theme?.heroHeadline || "Farm-fresh eggs & poultry"}
            </p>
            <Link
              href="#products"
              className="mt-8 inline-flex w-fit rounded-lg px-5 py-2.5 text-sm font-medium"
              style={{ backgroundColor: accent, color: "#1a1a1a" }}
            >
              Shop produce
            </Link>
          </div>
        </section>

        {theme?.aboutBlurb && (
          <section className="mx-auto max-w-3xl px-6 py-16 text-center md:px-10">
            <p className="text-lg leading-relaxed opacity-90">{theme.aboutBlurb}</p>
          </section>
        )}

        <section id="products" className="mx-auto max-w-6xl px-6 pb-20 md:px-10">
          <h2
            className="mb-8 text-3xl"
            style={{ fontFamily: "var(--shop-heading-font)" }}
          >
            Products
          </h2>
          <div
            className={`grid gap-8 ${
              layout === "minimal"
                ? "md:grid-cols-2"
                : "sm:grid-cols-2 lg:grid-cols-3"
            }`}
          >
            {products.map((p) => (
              <article key={p.id} className="group">
                <Link href={`/shop/${slug}/product/${p.id}`}>
                  <div className="aspect-[4/3] overflow-hidden rounded-xl bg-black/5">
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imageUrl}
                        alt={p.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className="flex h-full items-center justify-center text-sm opacity-50"
                        style={{ backgroundColor: `${primary}22` }}
                      >
                        No photo
                      </div>
                    )}
                  </div>
                  <h3 className="mt-3 font-medium">{p.title}</h3>
                  <p className="text-sm opacity-70">
                    {formatMoney(p.price, farm.currency)} / {p.unitLabel} ·{" "}
                    {p.stockQty} left
                  </p>
                </Link>
                <div className="mt-3">
                  <AddToCartButton
                    product={p}
                    primary={primary}
                    currency={farm.currency}
                  />
                </div>
              </article>
            ))}
            {products.length === 0 && (
              <p className="opacity-70">No products listed yet.</p>
            )}
          </div>
        </section>

        <footer className="border-t border-black/10 px-6 py-10 text-sm md:px-10">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 md:flex-row md:justify-between">
            <div>
              <p>{farm.name}</p>
              <Link href={`/shop/${slug}/orders`} className="underline opacity-80">
                Look up your orders
              </Link>
            </div>
            <div className="opacity-80">
              {theme?.contactPhone && <p>Phone: {theme.contactPhone}</p>}
              {theme?.contactWhatsapp && <p>WhatsApp: {theme.contactWhatsapp}</p>}
              {theme?.contactEmail && <p>Email: {theme.contactEmail}</p>}
              {theme?.shippingNotes && (
                <p className="mt-2 max-w-md">{theme.shippingNotes}</p>
              )}
            </div>
          </div>
        </footer>
      </div>
    </CartProvider>
  );
}
