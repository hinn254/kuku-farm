import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { invoiceItems, invoices } from "@/db/schema";
import { getCurrentFarmContext } from "@/lib/farm";
import { updateInvoiceStatusAction } from "@/app/actions/farm";
import { ActionForm } from "@/components/forms/action-form";
import { formatMoney } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { PrintButton } from "@/components/print-button";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { farm } = await getCurrentFarmContext();
  const invoice = await db.query.invoices.findFirst({
    where: and(eq(invoices.id, id), eq(invoices.farmId, farm.id)),
  });
  if (!invoice) notFound();

  const items = await db
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, invoice.id));

  return (
    <div className="invoice-print-page mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl">
            {invoice.number}
          </h1>
          <p className="capitalize text-muted-foreground">{invoice.status}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <PrintButton />
          <ActionForm
            action={updateInvoiceStatusAction}
            successMessage="Invoice status updated"
            className="flex gap-2"
          >
            <input type="hidden" name="farmId" value={farm.id} />
            <input type="hidden" name="invoiceId" value={invoice.id} />
            <select
              name="status"
              defaultValue={invoice.status}
              className="h-8 rounded-lg border border-input px-2 text-sm"
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="void">Void</option>
            </select>
            <Button type="submit" variant="outline" size="sm">
              Update status
            </Button>
          </ActionForm>
        </div>
      </div>

      <article className="invoice-sheet rounded-xl border border-border bg-white p-8 print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <div className="flex justify-between gap-4">
          <div>
            <p className="font-[family-name:var(--font-display)] text-2xl">
              {farm.name}
            </p>
            <p className="text-sm text-muted-foreground">
              Invoice {invoice.number}
            </p>
          </div>
          <div className="text-right text-sm">
            <p>Issued {invoice.issuedOn}</p>
            {invoice.dueOn && <p>Due {invoice.dueOn}</p>}
            <p className="mt-1 capitalize">Status: {invoice.status}</p>
          </div>
        </div>
        <div className="mt-8">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Bill to
          </p>
          <p className="font-medium">{invoice.counterpartyName}</p>
          {invoice.counterpartyEmail && (
            <p className="text-sm">{invoice.counterpartyEmail}</p>
          )}
          {invoice.counterpartyPhone && (
            <p className="text-sm">{invoice.counterpartyPhone}</p>
          )}
        </div>
        <table className="mt-8 w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">Description</th>
              <th className="py-2">Qty</th>
              <th className="py-2">Price</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b border-border/60">
                <td className="py-3">{item.description}</td>
                <td>{item.quantity}</td>
                <td>{formatMoney(item.unitPrice, farm.currency)}</td>
                <td className="text-right">
                  {formatMoney(item.lineTotal, farm.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-6 text-right text-lg font-semibold">
          Total {formatMoney(invoice.total, farm.currency)}
        </p>
        {invoice.notes && (
          <p className="mt-4 text-sm text-muted-foreground">{invoice.notes}</p>
        )}
      </article>
    </div>
  );
}
