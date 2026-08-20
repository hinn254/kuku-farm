import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { expenses } from "@/db/schema";
import { getCurrentFarmContext } from "@/lib/farm";
import { createExpenseAction } from "@/app/actions/farm";
import { ActionForm } from "@/components/forms/action-form";
import { EXPENSE_CATEGORIES, formatMoney } from "@/lib/constants";
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

export default async function ExpensesPage() {
  const { farm } = await getCurrentFarmContext();
  const rows = await db
    .select()
    .from(expenses)
    .where(eq(expenses.farmId, farm.id))
    .orderBy(desc(expenses.incurredOn))
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Expenses</h1>
        <p className="text-muted-foreground">Vaccines, feed, and other farm costs</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Record expense</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionForm
            action={createExpenseAction}
            successMessage="Expense recorded"
            encType="multipart/form-data"
            className="grid gap-3 sm:grid-cols-2"
          >
            <input type="hidden" name="farmId" value={farm.id} />
            <div className="space-y-1">
              <Label htmlFor="category">Category</Label>
              <select id="category" name="category" className="h-8 w-full rounded-lg border border-input px-2 text-sm" defaultValue="vaccine">
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="amount">Amount ({farm.currency})</Label>
              <Input id="amount" name="amount" type="number" step="0.01" min={0} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="incurredOn">Date</Label>
              <Input id="incurredOn" name="incurredOn" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="receipt">Receipt</Label>
              <Input id="receipt" name="receipt" type="file" accept="image/*,.pdf" />
            </div>
            <div className="space-y-1 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={2} />
            </div>
            <div>
              <Button type="submit" className="bg-[#2d6a4f] hover:bg-[#245a42]">Save expense</Button>
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
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{e.incurredOn}</TableCell>
                  <TableCell className="capitalize">{e.category}</TableCell>
                  <TableCell>{formatMoney(e.amount, farm.currency)}</TableCell>
                  <TableCell>{e.notes || "—"}</TableCell>
                  <TableCell>
                    {e.receiptUrl ? (
                      <a href={e.receiptUrl} className="underline" target="_blank" rel="noreferrer">
                        View
                      </a>
                    ) : (
                      "—"
                    )}
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
