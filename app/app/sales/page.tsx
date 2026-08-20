import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { flocks, products, sales } from "@/db/schema";
import { getCurrentFarmContext } from "@/lib/farm";
import { createSaleAction } from "@/app/actions/farm";
import { ActionForm } from "@/components/forms/action-form";
import { formatMoney } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

export default async function SalesPage() {
  const { farm } = await getCurrentFarmContext();
  const rows = await db
    .select()
    .from(sales)
    .where(eq(sales.farmId, farm.id))
    .orderBy(desc(sales.soldOn))
    .limit(100);
  const productRows = await db.select().from(products).where(eq(products.farmId, farm.id));
  const flockRows = await db.select().from(flocks).where(eq(flocks.farmId, farm.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Sales</h1>
        <p className="text-muted-foreground">Internal egg and chicken sales</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Record sale</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionForm
            action={createSaleAction}
            successMessage="Sale recorded"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            <input type="hidden" name="farmId" value={farm.id} />
            <div className="space-y-1">
              <Label htmlFor="type">Type</Label>
              <select id="type" name="type" className="h-8 w-full rounded-lg border border-input px-2 text-sm" defaultValue="eggs">
                <option value="eggs">Eggs</option>
                <option value="chicken">Chicken</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" name="quantity" type="number" min={1} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="unitPrice">Unit price</Label>
              <Input id="unitPrice" name="unitPrice" type="number" step="0.01" min={0} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="soldOn">Date</Label>
              <Input id="soldOn" name="soldOn" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="customerName">Customer</Label>
              <Input id="customerName" name="customerName" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="productId">Product (stock)</Label>
              <select id="productId" name="productId" className="h-8 w-full rounded-lg border border-input px-2 text-sm" defaultValue="">
                <option value="">None</option>
                {productRows.map((p) => (
                  <option key={p.id} value={p.id}>{p.title} ({p.stockQty})</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="flockId">Flock (chicken sales)</Label>
              <select id="flockId" name="flockId" className="h-8 w-full rounded-lg border border-input px-2 text-sm" defaultValue="">
                <option value="">None</option>
                {flockRows.map((f) => (
                  <option key={f.id} value={f.id}>{f.name} ({f.quantity})</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Button type="submit" className="bg-[#2d6a4f] hover:bg-[#245a42]">Save sale</Button>
            </div>
          </ActionForm>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Customer</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.soldOn}</TableCell>
                  <TableCell className="capitalize">{s.type}</TableCell>
                  <TableCell className="capitalize">{s.channel}</TableCell>
                  <TableCell>{s.quantity}</TableCell>
                  <TableCell>{formatMoney(s.total, farm.currency)}</TableCell>
                  <TableCell>{s.customerName || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
