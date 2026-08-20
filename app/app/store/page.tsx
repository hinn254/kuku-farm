import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { products, storefrontThemes } from "@/db/schema";
import { getCurrentFarmContext } from "@/lib/farm";
import {
  updateStoreSettingsAction,
  upsertProductAction,
  deleteProductAction,
  toggleProductActiveAction,
} from "@/app/actions/farm";
import { formatMoney } from "@/lib/constants";
import { SHOP_FONT_OPTIONS } from "@/lib/shop-fonts";
import { ActionForm } from "@/components/forms/action-form";
import { EditDialog } from "@/components/forms/edit-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

function ProductFields({
  defaults,
}: {
  defaults?: {
    title?: string;
    type?: string;
    price?: string;
    stockQty?: number;
    unitLabel?: string;
    description?: string | null;
    active?: boolean;
    lowStockThreshold?: number;
    imageUrl?: string | null;
  };
}) {
  return (
    <>
      <input type="hidden" name="existingImage" value={defaults?.imageUrl ?? ""} />
      <div className="space-y-1">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" required defaultValue={defaults?.title} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="type">Type</Label>
        <select
          id="type"
          name="type"
          className="h-8 w-full rounded-lg border border-input px-2 text-sm"
          defaultValue={defaults?.type ?? "eggs"}
        >
          <option value="eggs">Eggs</option>
          <option value="live_chicken">Live chicken</option>
          <option value="processed">Processed</option>
          <option value="other">Other</option>
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="price">Price</Label>
        <Input
          id="price"
          name="price"
          type="number"
          step="0.01"
          required
          defaultValue={defaults?.price}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="stockQty">Stock</Label>
        <Input
          id="stockQty"
          name="stockQty"
          type="number"
          defaultValue={defaults?.stockQty ?? 0}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="unitLabel">Unit label</Label>
        <Input
          id="unitLabel"
          name="unitLabel"
          defaultValue={defaults?.unitLabel ?? "tray"}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="lowStockThreshold">Low stock at</Label>
        <Input
          id="lowStockThreshold"
          name="lowStockThreshold"
          type="number"
          defaultValue={defaults?.lowStockThreshold ?? 5}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="active">Visibility</Label>
        <select
          id="active"
          name="active"
          className="h-8 w-full rounded-lg border border-input px-2 text-sm"
          defaultValue={defaults?.active === false ? "0" : "1"}
        >
          <option value="1">Active</option>
          <option value="0">Hidden</option>
        </select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="image">Photo</Label>
        <Input id="image" name="image" type="file" accept="image/*" />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={defaults?.description ?? ""}
        />
      </div>
    </>
  );
}

export default async function StorePage() {
  const { farm, membership } = await getCurrentFarmContext();
  const catalog = await db
    .select()
    .from(products)
    .where(eq(products.farmId, farm.id))
    .orderBy(desc(products.createdAt));
  const theme = await db.query.storefrontThemes.findFirst({
    where: eq(storefrontThemes.farmId, farm.id),
  });
  const isOwner = membership.role === "owner";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Store</h1>
        <p className="text-muted-foreground">
          Products, theme, and Paystack — shop at /shop/{farm.slug}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add product</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionForm
            action={upsertProductAction}
            successMessage="Product added"
            encType="multipart/form-data"
            className="grid gap-3 sm:grid-cols-2"
          >
            <input type="hidden" name="farmId" value={farm.id} />
            <ProductFields />
            <div>
              <Button type="submit" className="bg-[#2d6a4f] hover:bg-[#245a42]">
                Add product
              </Button>
            </div>
          </ActionForm>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catalog</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {catalog.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title}</TableCell>
                  <TableCell className="capitalize">
                    {p.type.replace("_", " ")}
                  </TableCell>
                  <TableCell>{formatMoney(p.price, farm.currency)}</TableCell>
                  <TableCell>
                    {p.stockQty} {p.unitLabel}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.active ? "default" : "secondary"}>
                      {p.active ? "Active" : "Hidden"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <EditDialog title={`Edit ${p.title}`}>
                        <ActionForm
                          action={upsertProductAction}
                          successMessage="Product saved"
                          encType="multipart/form-data"
                          className="grid gap-3 sm:grid-cols-2"
                        >
                          <input type="hidden" name="farmId" value={farm.id} />
                          <input type="hidden" name="productId" value={p.id} />
                          <ProductFields
                            defaults={{
                              title: p.title,
                              type: p.type,
                              price: p.price,
                              stockQty: p.stockQty,
                              unitLabel: p.unitLabel,
                              description: p.description,
                              active: p.active,
                              lowStockThreshold: p.lowStockThreshold,
                              imageUrl: p.imageUrl,
                            }}
                          />
                          <Button type="submit" className="bg-[#2d6a4f] hover:bg-[#245a42]">
                            Save product
                          </Button>
                        </ActionForm>
                      </EditDialog>
                      <ActionForm
                        action={toggleProductActiveAction}
                        successMessage={p.active ? "Product hidden" : "Product shown"}
                      >
                        <input type="hidden" name="farmId" value={farm.id} />
                        <input type="hidden" name="productId" value={p.id} />
                        <Button type="submit" size="sm" variant="outline">
                          {p.active ? "Hide" : "Show"}
                        </Button>
                      </ActionForm>
                      <ActionForm
                        action={deleteProductAction}
                        successMessage="Product deleted"
                      >
                        <input type="hidden" name="farmId" value={farm.id} />
                        <input type="hidden" name="productId" value={p.id} />
                        <Button type="submit" size="sm" variant="destructive">
                          Delete
                        </Button>
                      </ActionForm>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isOwner && theme && (
        <Card>
          <CardHeader>
            <CardTitle>Storefront &amp; Paystack</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm
              action={updateStoreSettingsAction}
              successMessage="Store settings saved"
              encType="multipart/form-data"
              className="grid gap-3 sm:grid-cols-2"
            >
              <input type="hidden" name="farmId" value={farm.id} />
              <input type="hidden" name="existingLogo" value={theme.logoUrl ?? ""} />
              <input type="hidden" name="existingHero" value={theme.heroImageUrl ?? ""} />

              <div className="space-y-1">
                <Label htmlFor="storefrontPublished">Published</Label>
                <select
                  id="storefrontPublished"
                  name="storefrontPublished"
                  className="h-8 w-full rounded-lg border border-input px-2 text-sm"
                  defaultValue={farm.storefrontPublished ? "1" : "0"}
                >
                  <option value="0">Draft</option>
                  <option value="1">Published</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="layout">Layout</Label>
                <select
                  id="layout"
                  name="layout"
                  className="h-8 w-full rounded-lg border border-input px-2 text-sm"
                  defaultValue={theme.layout}
                >
                  <option value="classic">Classic</option>
                  <option value="bold">Bold</option>
                  <option value="minimal">Minimal</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="fontHeading">Heading font</Label>
                <select
                  id="fontHeading"
                  name="fontHeading"
                  className="h-8 w-full rounded-lg border border-input px-2 text-sm"
                  defaultValue={theme.fontHeading}
                >
                  {SHOP_FONT_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="fontBody">Body font</Label>
                <select
                  id="fontBody"
                  name="fontBody"
                  className="h-8 w-full rounded-lg border border-input px-2 text-sm"
                  defaultValue={theme.fontBody}
                >
                  {SHOP_FONT_OPTIONS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="primaryColor">Primary</Label>
                <Input id="primaryColor" name="primaryColor" type="color" defaultValue={theme.primaryColor} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="accentColor">Accent</Label>
                <Input id="accentColor" name="accentColor" type="color" defaultValue={theme.accentColor} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="backgroundColor">Background</Label>
                <Input id="backgroundColor" name="backgroundColor" type="color" defaultValue={theme.backgroundColor} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="textColor">Text</Label>
                <Input id="textColor" name="textColor" type="color" defaultValue={theme.textColor} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="heroHeadline">Hero headline</Label>
                <Input id="heroHeadline" name="heroHeadline" defaultValue={theme.heroHeadline ?? ""} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="aboutBlurb">About</Label>
                <Textarea id="aboutBlurb" name="aboutBlurb" rows={2} defaultValue={theme.aboutBlurb ?? ""} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="contactPhone">Phone</Label>
                <Input id="contactPhone" name="contactPhone" defaultValue={theme.contactPhone ?? ""} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="contactWhatsapp">WhatsApp</Label>
                <Input id="contactWhatsapp" name="contactWhatsapp" defaultValue={theme.contactWhatsapp ?? ""} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="contactEmail">Email</Label>
                <Input id="contactEmail" name="contactEmail" defaultValue={theme.contactEmail ?? ""} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" name="currency" defaultValue={farm.currency} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="shippingNotes">Shipping / pickup notes</Label>
                <Textarea id="shippingNotes" name="shippingNotes" rows={2} defaultValue={theme.shippingNotes ?? ""} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="customCss">Custom CSS</Label>
                <Textarea
                  id="customCss"
                  name="customCss"
                  rows={4}
                  className="font-mono text-xs"
                  placeholder=".shop-hero { letter-spacing: 0.02em; }"
                  defaultValue={theme.customCss ?? ""}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="logo">Logo</Label>
                <Input id="logo" name="logo" type="file" accept="image/*" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="hero">Hero image</Label>
                <Input id="hero" name="hero" type="file" accept="image/*" />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="paystackPublicKey">Paystack public key</Label>
                <Input id="paystackPublicKey" name="paystackPublicKey" defaultValue={farm.paystackPublicKey ?? ""} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="paystackSecretKey">Paystack secret key</Label>
                <Input id="paystackSecretKey" name="paystackSecretKey" type="password" defaultValue={farm.paystackSecretKey ?? ""} />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="paystackSubaccount">Paystack subaccount (optional)</Label>
                <Input id="paystackSubaccount" name="paystackSubaccount" defaultValue={farm.paystackSubaccount ?? ""} />
              </div>
              <div>
                <Button type="submit" className="bg-[#2d6a4f] hover:bg-[#245a42]">
                  Save store settings
                </Button>
              </div>
            </ActionForm>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
