import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { invoices } from "@/db/schema";
import { getCurrentFarmContext } from "@/lib/farm";
import { createInvoiceAction } from "@/app/actions/farm";
import { ActionForm } from "@/components/forms/action-form";
import { formatMoney } from "@/lib/constants";
import { InvoiceLinesField } from "@/components/forms/invoice-lines";
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
import { Badge } from "@/components/ui/badge";

export default async function InvoicesPage() {
  const { farm } = await getCurrentFarmContext();
  const rows = await db
    .select()
    .from(invoices)
    .where(eq(invoices.farmId, farm.id))
    .orderBy(desc(invoices.createdAt));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Invoices</h1>
        <p className="text-muted-foreground">B2B and walk-in invoicing</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New invoice</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionForm
            action={createInvoiceAction}
            successMessage="Invoice created"
            className="grid gap-3 sm:grid-cols-2"
          >
            <input type="hidden" name="farmId" value={farm.id} />
            <div className="space-y-1">
              <Label htmlFor="counterpartyName">Customer name</Label>
              <Input id="counterpartyName" name="counterpartyName" required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="counterpartyPhone">Phone</Label>
              <Input id="counterpartyPhone" name="counterpartyPhone" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="counterpartyEmail">Email</Label>
              <Input id="counterpartyEmail" name="counterpartyEmail" type="email" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="issuedOn">Issued</Label>
              <Input
                id="issuedOn"
                name="issuedOn"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="dueOn">Due</Label>
              <Input id="dueOn" name="dueOn" type="date" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                className="h-8 w-full rounded-lg border border-input px-2 text-sm"
                defaultValue="draft"
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="void">Void</option>
              </select>
            </div>
            <InvoiceLinesField />
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" name="notes" />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" className="bg-[#2d6a4f] hover:bg-[#245a42]">
                Create invoice
              </Button>
            </div>
          </ActionForm>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Number</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.number}</TableCell>
                  <TableCell>{inv.counterpartyName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {inv.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatMoney(inv.total, farm.currency)}</TableCell>
                  <TableCell>
                    <Link
                      href={`/app/invoices/${inv.id}`}
                      className="text-sm underline"
                    >
                      Open
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
