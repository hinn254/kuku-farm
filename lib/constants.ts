export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function formatMoney(
  amount: number | string,
  currency: string = "KES"
): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}

export const FLOCK_STAGES = [
  "chick",
  "grower",
  "layer",
  "broiler_ready",
  "culled",
] as const;

export const STAGE_DEFAULT_DAYS: Record<(typeof FLOCK_STAGES)[number], number> =
  {
    chick: 28,
    grower: 90,
    layer: 365,
    broiler_ready: 14,
    culled: 9999,
  };

export const EXPENSE_CATEGORIES = [
  "vaccine",
  "feed",
  "meds",
  "labor",
  "utilities",
  "other",
] as const;
