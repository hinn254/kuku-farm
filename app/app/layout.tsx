import { auth } from "@clerk/nextjs/server";
import { AppSidebar } from "@/components/app-sidebar";
import { getCurrentFarmContext } from "@/lib/farm";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await auth.protect();
  const { farm, membership, memberships, user } = await getCurrentFarmContext();

  return (
    <div className="flex min-h-screen bg-[#fafbf9]">
      <AppSidebar
        farmName={farm.name}
        farmSlug={farm.slug}
        role={membership.role}
        activeFarmId={farm.id}
        memberships={memberships.map((m) => ({ farm: m.farm }))}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-white/80 px-6 py-3 backdrop-blur">
          <div>
            <p className="text-sm text-muted-foreground">Signed in as</p>
            <p className="text-sm font-medium">{user.name || user.email}</p>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
