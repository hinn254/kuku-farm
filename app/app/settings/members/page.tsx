import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { farmMembers, users } from "@/db/schema";
import { getCurrentFarmContext } from "@/lib/farm";
import {
  inviteMemberAction,
  updateMemberRoleAction,
  removeMemberAction,
} from "@/app/actions/farm";
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

export default async function MembersPage() {
  const { farm, membership, user } = await getCurrentFarmContext();
  const members = await db
    .select({
      member: farmMembers,
      user: users,
    })
    .from(farmMembers)
    .innerJoin(users, eq(farmMembers.userId, users.id))
    .where(eq(farmMembers.farmId, farm.id));

  const isOwner = membership.role === "owner";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl">Members</h1>
        <p className="text-muted-foreground">Owners and staff on this farm</p>
      </div>

      {isOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Add member</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-sm text-muted-foreground">
              They must already have signed up with Clerk using that email.
            </p>
            <ActionForm
              action={inviteMemberAction}
              successMessage="Member added"
              className="flex flex-wrap items-end gap-3"
            >
              <input type="hidden" name="farmId" value={farm.id} />
              <div className="space-y-1">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  name="role"
                  className="h-8 rounded-lg border border-input px-2 text-sm"
                  defaultValue="staff"
                >
                  <option value="staff">Staff</option>
                  <option value="owner">Owner</option>
                </select>
              </div>
              <Button type="submit" className="bg-[#2d6a4f] hover:bg-[#245a42]">
                Add
              </Button>
            </ActionForm>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Team</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                {isOwner && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map(({ member, user: memberUser }) => (
                <TableRow key={member.id}>
                  <TableCell>{memberUser.name || "—"}</TableCell>
                  <TableCell>{memberUser.email}</TableCell>
                  <TableCell className="capitalize">{member.role}</TableCell>
                  {isOwner && (
                    <TableCell>
                      {memberUser.id === user.id ? (
                        <span className="text-xs text-muted-foreground">You</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <ActionForm
                            action={updateMemberRoleAction}
                            successMessage="Role updated"
                            className="flex gap-2"
                          >
                            <input type="hidden" name="farmId" value={farm.id} />
                            <input type="hidden" name="memberId" value={member.id} />
                            <select
                              name="role"
                              defaultValue={member.role}
                              className="h-8 rounded-lg border border-input px-2 text-sm"
                            >
                              <option value="staff">Staff</option>
                              <option value="owner">Owner</option>
                            </select>
                            <Button type="submit" size="sm" variant="outline">
                              Update
                            </Button>
                          </ActionForm>
                          <ActionForm
                            action={removeMemberAction}
                            successMessage="Member removed"
                          >
                            <input type="hidden" name="farmId" value={farm.id} />
                            <input type="hidden" name="memberId" value={member.id} />
                            <Button type="submit" size="sm" variant="destructive">
                              Remove
                            </Button>
                          </ActionForm>
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
