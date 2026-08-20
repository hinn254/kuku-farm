import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { cageAccessLogs, cages, users } from "@/db/schema";
import { getCurrentFarmContext } from "@/lib/farm";
import { createCageAction, logCageAccessAction, updateCageAction, deleteCageAction } from "@/app/actions/farm";
import { ActionForm } from "@/components/forms/action-form";
import { EditDialog } from "@/components/forms/edit-dialog";
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

export default async function CagesPage() {
  const { farm } = await getCurrentFarmContext();
  const cageRows = await db
    .select()
    .from(cages)
    .where(eq(cages.farmId, farm.id))
    .orderBy(desc(cages.createdAt));

  const logs = await db
    .select({
      log: cageAccessLogs,
      userName: users.name,
      userEmail: users.email,
      cageName: cages.name,
    })
    .from(cageAccessLogs)
    .leftJoin(users, eq(cageAccessLogs.userId, users.id))
    .leftJoin(cages, eq(cageAccessLogs.cageId, cages.id))
    .where(eq(cageAccessLogs.farmId, farm.id))
    .orderBy(desc(cageAccessLogs.enteredAt))
    .limit(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Cages</h1>
        <p className="text-muted-foreground">
          Housing units and who accessed them
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add cage</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm
              action={createCageAction}
              successMessage="Cage added"
              className="space-y-3"
            >
              <input type="hidden" name="farmId" value={farm.id} />
              <div className="space-y-1">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" required placeholder="House 1" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="capacity">Capacity</Label>
                <Input id="capacity" name="capacity" type="number" defaultValue={50} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="notes">Notes</Label>
                <Input id="notes" name="notes" />
              </div>
              <Button type="submit" className="bg-[#2d6a4f] hover:bg-[#245a42]">
                Add cage
              </Button>
            </ActionForm>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Log access</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm
              action={logCageAccessAction}
              successMessage="Access logged"
              className="space-y-3"
            >
              <input type="hidden" name="farmId" value={farm.id} />
              <div className="space-y-1">
                <Label htmlFor="cageId">Cage</Label>
                <select
                  id="cageId"
                  name="cageId"
                  required
                  className="h-8 w-full rounded-lg border border-input px-2 text-sm"
                >
                  {cageRows.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="purpose">Purpose</Label>
                <Input id="purpose" name="purpose" placeholder="Feeding, vaccine…" />
              </div>
              <Button type="submit" className="bg-[#2d6a4f] hover:bg-[#245a42]">
                Log entry
              </Button>
            </ActionForm>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cages</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-40">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cageRows.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.capacity}</TableCell>
                  <TableCell>{c.notes || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <EditDialog title={`Edit ${c.name}`}>
                        <ActionForm
                          action={updateCageAction}
                          successMessage="Cage updated"
                          className="space-y-3"
                        >
                          <input type="hidden" name="farmId" value={farm.id} />
                          <input type="hidden" name="cageId" value={c.id} />
                          <div className="space-y-1">
                            <Label>Name</Label>
                            <Input name="name" defaultValue={c.name} required />
                          </div>
                          <div className="space-y-1">
                            <Label>Capacity</Label>
                            <Input name="capacity" type="number" defaultValue={c.capacity} />
                          </div>
                          <div className="space-y-1">
                            <Label>Notes</Label>
                            <Input name="notes" defaultValue={c.notes ?? ""} />
                          </div>
                          <Button type="submit" className="bg-[#2d6a4f] hover:bg-[#245a42]">
                            Save
                          </Button>
                        </ActionForm>
                      </EditDialog>
                      <ActionForm action={deleteCageAction} successMessage="Cage deleted">
                        <input type="hidden" name="farmId" value={farm.id} />
                        <input type="hidden" name="cageId" value={c.id} />
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

      <Card>
        <CardHeader>
          <CardTitle>Access history</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Cage</TableHead>
                <TableHead>Who</TableHead>
                <TableHead>Purpose</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map(({ log, userName, userEmail, cageName }) => (
                <TableRow key={log.id}>
                  <TableCell>
                    {log.enteredAt.toLocaleString()}
                  </TableCell>
                  <TableCell>{cageName}</TableCell>
                  <TableCell>{userName || userEmail || "—"}</TableCell>
                  <TableCell>{log.purpose || "—"}</TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    No access logs yet.
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
