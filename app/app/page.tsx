import { and, eq, gte, sql, desc } from "drizzle-orm";
import { differenceInDays, subDays, formatISO } from "date-fns";
import Link from "next/link";
import { db } from "@/lib/db";
import {
  cages,
  eggCollections,
  expenses,
  flockStageHistory,
  flocks,
  products,
  sales,
} from "@/db/schema";
import { getCurrentFarmContext } from "@/lib/farm";
import { formatMoney, STAGE_DEFAULT_DAYS } from "@/lib/constants";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardPage() {
  const { farm } = await getCurrentFarmContext();
  const weekAgo = formatISO(subDays(new Date(), 7), { representation: "date" });

  const flockRows = await db
    .select()
    .from(flocks)
    .where(eq(flocks.farmId, farm.id));

  const byStage = flockRows.reduce<Record<string, number>>((acc, f) => {
    acc[f.stage] = (acc[f.stage] ?? 0) + f.quantity;
    return acc;
  }, {});

  const [eggWeek] = await db
    .select({
      total: sql<number>`coalesce(sum(${eggCollections.quantity}), 0)::int`,
    })
    .from(eggCollections)
    .where(
      and(
        eq(eggCollections.farmId, farm.id),
        gte(eggCollections.collectedOn, weekAgo)
      )
    );

  const [salesTotal] = await db
    .select({
      total: sql<string>`coalesce(sum(${sales.total}), 0)`,
    })
    .from(sales)
    .where(eq(sales.farmId, farm.id));

  const [expenseTotal] = await db
    .select({
      total: sql<string>`coalesce(sum(${expenses.amount}), 0)`,
    })
    .from(expenses)
    .where(eq(expenses.farmId, farm.id));

  const revenue = Number(salesTotal?.total ?? 0);
  const costs = Number(expenseTotal?.total ?? 0);
  const pnl = revenue - costs;

  const lowStock = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.farmId, farm.id),
        eq(products.active, true),
        sql`${products.stockQty} <= ${products.lowStockThreshold}`
      )
    );

  const occupiedCageIds = new Set(
    flockRows.filter((f) => f.cageId && f.quantity > 0).map((f) => f.cageId!)
  );
  const allCages = await db
    .select()
    .from(cages)
    .where(eq(cages.farmId, farm.id));
  const emptyCages = allCages.filter((c) => !occupiedCageIds.has(c.id));

  const stageAlerts: { name: string; stage: string; days: number }[] = [];
  for (const flock of flockRows) {
    if (flock.stage === "culled") continue;
    const history = await db
      .select()
      .from(flockStageHistory)
      .where(eq(flockStageHistory.flockId, flock.id))
      .orderBy(desc(flockStageHistory.changedAt))
      .limit(1);
    const since = history[0]?.changedAt ?? flock.createdAt;
    const days = differenceInDays(new Date(), since);
    const max = STAGE_DEFAULT_DAYS[flock.stage];
    if (days > max) {
      stageAlerts.push({ name: flock.name, stage: flock.stage, days });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Overview for {farm.name}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Birds on farm</CardDescription>
            <CardTitle className="text-3xl">
              {flockRows.reduce((s, f) => s + f.quantity, 0)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Eggs this week</CardDescription>
            <CardTitle className="text-3xl">{eggWeek?.total ?? 0}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Revenue</CardDescription>
            <CardTitle className="text-2xl">
              {formatMoney(revenue, farm.currency)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>P&amp;L</CardDescription>
            <CardTitle
              className={`text-2xl ${pnl >= 0 ? "text-[#2d6a4f]" : "text-destructive"}`}
            >
              {formatMoney(pnl, farm.currency)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Costs {formatMoney(costs, farm.currency)}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Birds by stage</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {Object.entries(byStage).length === 0 && (
            <p className="text-sm text-muted-foreground">
              No flocks yet.{" "}
              <Link href="/app/flocks" className="underline">
                Add a flock
              </Link>
            </p>
          )}
          {Object.entries(byStage).map(([stage, qty]) => (
            <div
              key={stage}
              className="rounded-lg bg-[#e8f0ea] px-3 py-2 text-sm capitalize"
            >
              {stage.replace("_", " ")}: <strong>{qty}</strong>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="space-y-3">
        {stageAlerts.map((a) => (
          <Alert key={`${a.name}-${a.stage}`}>
            <AlertTitle>Stage overdue</AlertTitle>
            <AlertDescription>
              {a.name} has been in {a.stage.replace("_", " ")} for {a.days}{" "}
              days — consider advancing the stage.
            </AlertDescription>
          </Alert>
        ))}
        {lowStock.map((p) => (
          <Alert key={p.id}>
            <AlertTitle>Low stock</AlertTitle>
            <AlertDescription>
              {p.title} has {p.stockQty} left (threshold {p.lowStockThreshold}).
            </AlertDescription>
          </Alert>
        ))}
        {emptyCages.map((c) => (
          <Alert key={c.id}>
            <AlertTitle>Empty cage</AlertTitle>
            <AlertDescription>{c.name} has no active flock.</AlertDescription>
          </Alert>
        ))}
      </div>
    </div>
  );
}
