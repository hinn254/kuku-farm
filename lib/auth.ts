import { auth, currentUser } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  farmMembers,
  farms,
  users,
  type Farm,
  type FarmMember,
  type MemberRole,
} from "@/db/schema";

export async function ensureUser() {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email =
    clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId
    )?.emailAddress ??
    clerkUser.emailAddresses[0]?.emailAddress ??
    `${userId}@users.local`;

  const name = clerkUser.fullName;
  const imageUrl = clerkUser.imageUrl;

  const [user] = await db
    .insert(users)
    .values({
      id: userId,
      email,
      name,
      imageUrl,
    })
    .onConflictDoUpdate({
      target: users.id,
      set: {
        email,
        name,
        imageUrl,
      },
    })
    .returning();

  return user;
}

export async function requireUser() {
  const user = await ensureUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export async function getMemberships(userId: string) {
  return db
    .select({
      membership: farmMembers,
      farm: farms,
    })
    .from(farmMembers)
    .innerJoin(farms, eq(farmMembers.farmId, farms.id))
    .where(eq(farmMembers.userId, userId));
}

export async function requireFarmAccess(
  farmId: string,
  roles?: MemberRole[]
): Promise<{ farm: Farm; membership: FarmMember }> {
  const user = await requireUser();
  const membership = await db.query.farmMembers.findFirst({
    where: and(
      eq(farmMembers.farmId, farmId),
      eq(farmMembers.userId, user.id)
    ),
  });

  if (!membership) throw new Error("Forbidden");
  if (roles && !roles.includes(membership.role)) {
    throw new Error("Forbidden");
  }

  const farm = await db.query.farms.findFirst({
    where: eq(farms.id, farmId),
  });
  if (!farm) throw new Error("Farm not found");

  return { farm, membership };
}

export async function getActiveFarmId(
  cookieFarmId?: string | null
): Promise<string | null> {
  const user = await ensureUser();
  if (!user) return null;

  const memberships = await getMemberships(user.id);
  if (memberships.length === 0) return null;

  if (cookieFarmId && memberships.some((m) => m.farm.id === cookieFarmId)) {
    return cookieFarmId;
  }

  return memberships[0].farm.id;
}
