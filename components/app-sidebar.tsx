"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bird,
  Egg,
  LayoutDashboard,
  Warehouse,
  Wallet,
  Receipt,
  ShoppingBag,
  Store,
  Users,
  Package,
  Settings,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import { switchFarmAction } from "@/app/actions/farm";
import { ActionForm } from "@/components/forms/action-form";

const links = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/flocks", label: "Flocks", icon: Bird },
  { href: "/app/cages", label: "Cages", icon: Warehouse },
  { href: "/app/eggs", label: "Eggs", icon: Egg },
  { href: "/app/expenses", label: "Expenses", icon: Wallet },
  { href: "/app/sales", label: "Sales", icon: ShoppingBag },
  { href: "/app/invoices", label: "Invoices", icon: Receipt },
  { href: "/app/store", label: "Store", icon: Store },
  { href: "/app/orders", label: "Orders", icon: Package },
  { href: "/app/settings/members", label: "Members", icon: Users },
  { href: "/app/settings/farm", label: "Farm", icon: Settings },
];

type Props = {
  farmName: string;
  farmSlug: string;
  role: string;
  memberships: { farm: { id: string; name: string } }[];
  activeFarmId: string;
};

export function AppSidebar({
  farmName,
  farmSlug,
  role,
  memberships,
  activeFarmId,
}: Props) {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-[#f4f7f4] text-[#1b2e1f]">
      <div className="border-b border-border px-4 py-5">
        <p className="font-[family-name:var(--font-display)] text-xl tracking-tight">
          Kuku Farm
        </p>
        <p className="mt-1 truncate text-sm text-muted-foreground">{farmName}</p>
        <p className="text-xs capitalize text-muted-foreground">{role}</p>
        <Link
          href={`/shop/${farmSlug}`}
          target="_blank"
          className="mt-3 inline-flex h-7 w-full items-center justify-center rounded-lg border border-border bg-background px-2.5 text-[0.8rem] font-medium hover:bg-muted"
        >
          View shop
        </Link>
      </div>

      {memberships.length > 1 && (
        <ActionForm
          action={switchFarmAction}
          successMessage="Switched farm"
          className="border-b border-border p-3"
        >
          <label className="mb-1 block text-xs text-muted-foreground">
            Switch farm
          </label>
          <select
            name="farmId"
            defaultValue={activeFarmId}
            className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
          >
            {memberships.map((m) => (
              <option key={m.farm.id} value={m.farm.id}>
                {m.farm.name}
              </option>
            ))}
          </select>
        </ActionForm>
      )}

      <nav className="flex flex-1 flex-col gap-0.5 p-2">
        {links.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/app" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-[#2d6a4f] text-white"
                  : "hover:bg-black/5"
              )}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <UserButton />
      </div>
    </aside>
  );
}
