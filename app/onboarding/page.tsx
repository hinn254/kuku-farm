import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { ensureUser, getMemberships } from "@/lib/auth";
import { FarmOnboarding } from "@/components/onboarding/farm-onboarding";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  await auth.protect();
  const user = await ensureUser();
  if (!user) redirect("/sign-in");
  const params = await searchParams;
  const memberships = await getMemberships(user.id);
  const creatingAnother = params.new === "1";

  if (memberships.length > 0 && !creatingAnother) {
    redirect("/app");
  }

  return (
    <FarmOnboarding
      creatingAnother={creatingAnother}
      userName={user.name}
    />
  );
}
