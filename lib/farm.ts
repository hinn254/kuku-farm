import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { farms, farmMembers, storefrontThemes } from "@/db/schema";
import { ensureUser, getMemberships, requireFarmAccess } from "@/lib/auth";

export const ACTIVE_FARM_COOKIE = "kuku_active_farm";

export async function getCurrentFarmContext() {
  const user = await ensureUser();
  if (!user) redirect("/sign-in");

  const memberships = await getMemberships(user.id);
  if (memberships.length === 0) redirect("/onboarding");

  const cookieStore = await cookies();
  const cookieFarmId = cookieStore.get(ACTIVE_FARM_COOKIE)?.value;
  const active =
    memberships.find((m) => m.farm.id === cookieFarmId) ?? memberships[0];

  return {
    user,
    farm: active.farm,
    membership: active.membership,
    memberships,
  };
}

export async function setActiveFarm(farmId: string) {
  await requireFarmAccess(farmId);
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_FARM_COOKIE, farmId, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
  });
}

export async function getFarmBySlug(slug: string) {
  const farm = await db.query.farms.findFirst({
    where: eq(farms.slug, slug),
  });
  if (!farm) return null;

  const theme = await db.query.storefrontThemes.findFirst({
    where: eq(storefrontThemes.farmId, farm.id),
  });

  return { ...farm, theme: theme ?? null };
}

export async function getUserMembership(farmId: string, userId: string) {
  return db.query.farmMembers.findFirst({
    where: and(eq(farmMembers.farmId, farmId), eq(farmMembers.userId, userId)),
  });
}
