import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { cages, eggCollections, flocks } from "@/db/schema";
import { getCurrentFarmContext } from "@/lib/farm";
import { logEggsAction } from "@/app/actions/farm";
import { ActionForm } from "@/components/forms/action-form";
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

export default async function EggsPage() {
  const { farm } = await getCurrentFarmContext();
  const collections = await db
    .select()
    .from(eggCollections)
    .where(eq(eggCollections.farmId, farm.id))
    .orderBy(desc(eggCollections.collectedOn))
    .limit(100);
  const flockRows = await db.select().from(flocks).where(eq(flocks.farmId, farm.id));
  const cageRows = await db.select().from(cages).where(eq(cages.farmId, farm.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Eggs</h1>
        <p className="text-muted-foreground">Daily egg collection logs</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Log collection</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionForm
            action={logEggsAction}
            successMessage="Egg collection saved"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            <input type="hidden" name="farmId" value={farm.id} />
            <div className="space-y-1">
              <Label htmlFor="collectedOn">Date</Label>
              <Input
                id="collectedOn"
                name="collectedOn"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" name="quantity" type="number" min={0} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="brokenCount">Broken</Label>
              <Input id="brokenCount" name="brokenCount" type="number" min={0} defaultValue={0} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="grade">Grade</Label>
              <select id="grade" name="grade" className="h-8 w-full rounded-lg border border-input px-2 text-sm" defaultValue="mixed">
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="xlarge">X-Large</option>
                <option value="mixed">Mixed</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="flockId">Flock</Label>
              <select id="flockId" name="flockId" className="h-8 w-full rounded-lg border border-input px-2 text-sm" defaultValue="">
                <option value="">Optional</option>
                {flockRows.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="cageId">Cage</Label>
              <select id="cageId" name="cageId" className="h-8 w-full rounded-lg border border-input px-2 text-sm" defaultValue="">
                <option value="">Optional</option>
                {cageRows.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Button type="submit" className="bg-[#2d6a4f] hover:bg-[#245a42]">Save collection</Button>
            </div>
          </ActionForm>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent collections</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Broken</TableHead>
                <TableHead>Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {collections.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.collectedOn}</TableCell>
                  <TableCell>{c.quantity}</TableCell>
                  <TableCell>{c.brokenCount}</TableCell>
                  <TableCell className="capitalize">{c.grade}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
