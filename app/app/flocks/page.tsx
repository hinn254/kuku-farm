import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { flockStageHistory, flocks, cages } from "@/db/schema";
import { getCurrentFarmContext } from "@/lib/farm";
import { createFlockAction, updateFlockStageAction, updateFlockAction, deleteFlockAction } from "@/app/actions/farm";
import { ActionForm } from "@/components/forms/action-form";
import { EditDialog } from "@/components/forms/edit-dialog";
import { FLOCK_STAGES } from "@/lib/constants";
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

export default async function FlocksPage() {
  const { farm } = await getCurrentFarmContext();
  const rows = await db
    .select()
    .from(flocks)
    .where(eq(flocks.farmId, farm.id))
    .orderBy(desc(flocks.createdAt));
  const cageRows = await db
    .select()
    .from(cages)
    .where(eq(cages.farmId, farm.id));

  const histories = await Promise.all(
    rows.map(async (f) => ({
      flockId: f.id,
      history: await db
        .select()
        .from(flockStageHistory)
        .where(eq(flockStageHistory.flockId, f.id))
        .orderBy(desc(flockStageHistory.changedAt)),
    }))
  );
  const historyMap = new Map(histories.map((h) => [h.flockId, h.history]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Flocks</h1>
        <p className="text-muted-foreground">
          Batches of birds and their growth stages
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add flock</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionForm
            action={createFlockAction}
            successMessage="Flock added"
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          >
            <input type="hidden" name="farmId" value={farm.id} />
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required placeholder="Batch A" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="breed">Breed</Label>
              <Input id="breed" name="breed" placeholder="Kuroiler" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" name="quantity" type="number" min={0} defaultValue={0} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="acquiredAt">Acquired</Label>
              <Input
                id="acquiredAt"
                name="acquiredAt"
                type="date"
                defaultValue={new Date().toISOString().slice(0, 10)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="stage">Stage</Label>
              <select
                id="stage"
                name="stage"
                className="h-8 w-full rounded-lg border border-input px-2 text-sm"
                defaultValue="chick"
              >
                {FLOCK_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="cageId">Cage</Label>
              <select
                id="cageId"
                name="cageId"
                className="h-8 w-full rounded-lg border border-input px-2 text-sm"
                defaultValue=""
              >
                <option value="">None</option>
                {cageRows.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Button type="submit" className="bg-[#2d6a4f] hover:bg-[#245a42]">
                Add flock
              </Button>
            </div>
          </ActionForm>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current flocks</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Breed</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Timeline</TableHead>
                <TableHead>Advance</TableHead>
                <TableHead>Edit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.name}</TableCell>
                  <TableCell>{f.breed}</TableCell>
                  <TableCell>{f.quantity}</TableCell>
                  <TableCell className="capitalize">
                    {f.stage.replace("_", " ")}
                  </TableCell>
                  <TableCell className="max-w-xs text-xs text-muted-foreground">
                    {(historyMap.get(f.id) ?? [])
                      .slice(0, 4)
                      .map(
                        (h) =>
                          `${h.toStage.replace("_", " ")} (${h.changedAt.toLocaleDateString()})`
                      )
                      .join(" → ") || "—"}
                  </TableCell>
                  <TableCell>
                    <ActionForm
                      action={updateFlockStageAction}
                      successMessage="Flock stage updated"
                      className="flex gap-2"
                    >
                      <input type="hidden" name="farmId" value={farm.id} />
                      <input type="hidden" name="flockId" value={f.id} />
                      <select
                        name="stage"
                        defaultValue={f.stage}
                        className="h-8 rounded-lg border border-input px-2 text-sm"
                      >
                        {FLOCK_STAGES.map((s) => (
                          <option key={s} value={s}>
                            {s.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                      <Button type="submit" size="sm" variant="outline">
                        Save
                      </Button>
                    </ActionForm>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <EditDialog title={`Edit ${f.name}`}>
                        <ActionForm
                          action={updateFlockAction}
                          successMessage="Flock updated"
                          className="space-y-3"
                        >
                          <input type="hidden" name="farmId" value={farm.id} />
                          <input type="hidden" name="flockId" value={f.id} />
                          <div className="space-y-1">
                            <Label>Name</Label>
                            <Input name="name" defaultValue={f.name} required />
                          </div>
                          <div className="space-y-1">
                            <Label>Breed</Label>
                            <Input name="breed" defaultValue={f.breed} />
                          </div>
                          <div className="space-y-1">
                            <Label>Quantity</Label>
                            <Input name="quantity" type="number" defaultValue={f.quantity} />
                          </div>
                          <div className="space-y-1">
                            <Label>Acquired</Label>
                            <Input name="acquiredAt" type="date" defaultValue={f.acquiredAt} />
                          </div>
                          <div className="space-y-1">
                            <Label>Cage</Label>
                            <select
                              name="cageId"
                              defaultValue={f.cageId ?? ""}
                              className="h-8 w-full rounded-lg border border-input px-2 text-sm"
                            >
                              <option value="">None</option>
                              {cageRows.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <Label>Notes</Label>
                            <Input name="notes" defaultValue={f.notes ?? ""} />
                          </div>
                          <Button type="submit" className="bg-[#2d6a4f] hover:bg-[#245a42]">
                            Save
                          </Button>
                        </ActionForm>
                      </EditDialog>
                      <ActionForm action={deleteFlockAction} successMessage="Flock deleted">
                        <input type="hidden" name="farmId" value={farm.id} />
                        <input type="hidden" name="flockId" value={f.id} />
                        <Button type="submit" size="sm" variant="destructive">
                          Delete
                        </Button>
                      </ActionForm>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground">
                    No flocks yet.
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
