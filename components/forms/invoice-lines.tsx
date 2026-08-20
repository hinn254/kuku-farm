"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export type InvoiceLineDraft = {
  description: string;
  quantity: number;
  unitPrice: number;
  saleType: "eggs" | "chicken" | "other";
};

const emptyLine = (): InvoiceLineDraft => ({
  description: "",
  quantity: 1,
  unitPrice: 0,
  saleType: "eggs",
});

export function InvoiceLinesField({
  name = "linesJson",
}: {
  name?: string;
}) {
  const [lines, setLines] = useState<InvoiceLineDraft[]>([emptyLine()]);

  const total = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);

  return (
    <div className="space-y-3 sm:col-span-2">
      <Label>Line items</Label>
      <input type="hidden" name={name} value={JSON.stringify(lines)} />
      {lines.map((line, idx) => (
        <div
          key={idx}
          className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-[1.5fr_0.6fr_0.7fr_0.7fr_auto]"
        >
          <Input
            placeholder="Description"
            value={line.description}
            onChange={(e) => {
              const next = [...lines];
              next[idx] = { ...line, description: e.target.value };
              setLines(next);
            }}
            required
          />
          <Input
            type="number"
            min={1}
            value={line.quantity}
            onChange={(e) => {
              const next = [...lines];
              next[idx] = { ...line, quantity: Number(e.target.value) || 1 };
              setLines(next);
            }}
          />
          <Input
            type="number"
            min={0}
            step="0.01"
            value={line.unitPrice}
            onChange={(e) => {
              const next = [...lines];
              next[idx] = { ...line, unitPrice: Number(e.target.value) || 0 };
              setLines(next);
            }}
          />
          <select
            className="h-8 rounded-lg border border-input px-2 text-sm"
            value={line.saleType}
            onChange={(e) => {
              const next = [...lines];
              next[idx] = {
                ...line,
                saleType: e.target.value as InvoiceLineDraft["saleType"],
              };
              setLines(next);
            }}
          >
            <option value="eggs">Eggs</option>
            <option value="chicken">Chicken</option>
            <option value="other">Other</option>
          </select>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={lines.length === 1}
            onClick={() => setLines(lines.filter((_, i) => i !== idx))}
          >
            Remove
          </Button>
        </div>
      ))}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setLines([...lines, emptyLine()])}
        >
          Add line
        </Button>
        <p className="text-sm font-medium">Subtotal: {total.toFixed(2)}</p>
      </div>
    </div>
  );
}
