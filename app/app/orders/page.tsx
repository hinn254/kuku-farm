import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/db/schema";
import { getCurrentFarmContext } from "@/lib/farm";
import { fulfillOrderAction } from "@/app/actions/farm";
import { ActionForm } from "@/components/forms/action-form";
import { formatMoney } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export default async function OrdersPage() {
  const { farm } = await getCurrentFarmContext();
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.farmId, farm.id))
    .orderBy(desc(orders.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Orders</h1>
        <p className="text-muted-foreground">Storefront checkout orders</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Buyer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <div className="font-medium">{o.buyerName}</div>
                    <div className="text-xs text-muted-foreground">{o.buyerEmail}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {o.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatMoney(o.total, o.currency)}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {o.paystackReference || "—"}
                  </TableCell>
                  <TableCell>
                    {o.status === "paid" && (
                      <ActionForm
                        action={fulfillOrderAction}
                        successMessage="Order marked fulfilled"
                      >
                        <input type="hidden" name="farmId" value={farm.id} />
                        <input type="hidden" name="orderId" value={o.id} />
                        <Button type="submit" size="sm" variant="outline">
                          Mark fulfilled
                        </Button>
                      </ActionForm>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No orders yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
