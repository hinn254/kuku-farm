"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, ArrowRight, Bird, Egg, Warehouse } from "lucide-react";
import { createFarmAction } from "@/app/actions/farm";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "name", label: "Farm name" },
  { id: "currency", label: "Currency" },
  { id: "region", label: "Region" },
  { id: "review", label: "Launch" },
] as const;

const CURRENCIES = [
  {
    code: "KES",
    name: "Kenya Shilling",
    hint: "East Africa",
  },
  {
    code: "NGN",
    name: "Nigerian Naira",
    hint: "West Africa",
  },
  {
    code: "GHS",
    name: "Ghana Cedi",
    hint: "West Africa",
  },
  {
    code: "ZAR",
    name: "South African Rand",
    hint: "Southern Africa",
  },
  {
    code: "USD",
    name: "US Dollar",
    hint: "International",
  },
] as const;

const REGIONS = [
  {
    timezone: "Africa/Nairobi",
    label: "Nairobi",
    hint: "Kenya / Uganda / Tanzania",
  },
  {
    timezone: "Africa/Lagos",
    label: "Lagos",
    hint: "Nigeria / West Africa",
  },
  {
    timezone: "Africa/Accra",
    label: "Accra",
    hint: "Ghana",
  },
  {
    timezone: "Africa/Johannesburg",
    label: "Johannesburg",
    hint: "South Africa",
  },
] as const;

type Props = {
  creatingAnother?: boolean;
  userName?: string | null;
};

export function FarmOnboarding({ creatingAnother, userName }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("KES");
  const [timezone, setTimezone] = useState("Africa/Nairobi");
  const [pending, startTransition] = useTransition();

  const canNext =
    (step === 0 && name.trim().length >= 2) ||
    step === 1 ||
    step === 2 ||
    step === 3;

  function goNext() {
    if (step < STEPS.length - 1 && canNext) setStep((s) => s + 1);
  }

  function goBack() {
    if (step > 0) setStep((s) => s - 1);
  }

  function submit() {
    const fd = new FormData();
    fd.set("name", name.trim());
    fd.set("currency", currency);
    fd.set("timezone", timezone);
    startTransition(() => {
      void createFarmAction(fd)
        .then(() => {
          toast.success("Farm created");
        })
        .catch((err: unknown) => {
          if (
            err &&
            typeof err === "object" &&
            "digest" in err &&
            String((err as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
          ) {
            toast.success("Farm created");
            return;
          }
          toast.error(
            err instanceof Error ? err.message : "Could not create farm"
          );
        });
    });
  }

  return (
    <div className="flex min-h-screen bg-[#f3f6f4]">
      {/* Sidebar stepper */}
      <aside className="relative hidden w-[280px] shrink-0 flex-col border-r border-[#d8e3db] bg-white px-8 py-10 md:flex lg:w-[320px]">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-[#2d6a4f] text-sm font-semibold text-white">
            K
          </span>
          <span className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[#1a2e1c]">
            Kuku Farm
          </span>
        </div>

        <nav className="mt-14 flex flex-col gap-1" aria-label="Onboarding steps">
          {STEPS.map((s, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <div
                key={s.id}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl px-2 py-3 transition-colors",
                  current && "bg-[#e8f2ec]"
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300",
                    done && "bg-[#3d8b5f] text-white",
                    current && "bg-[#2d6a4f] text-white scale-105",
                    !done && !current && "bg-[#e8eee9] text-[#7a8f80]"
                  )}
                >
                  {done ? <Check className="size-4" strokeWidth={2.5} /> : i + 1}
                </span>
                <span
                  className={cn(
                    "text-xs font-semibold tracking-[0.12em] uppercase",
                    current && "text-[#2d6a4f]",
                    done && "text-[#7a8f80]",
                    !done && !current && "text-[#a3b5aa]"
                  )}
                >
                  {s.label}
                </span>
                {current && (
                  <ArrowRight className="ml-auto size-4 text-[#2d6a4f] animate-in fade-in slide-in-from-left-1 duration-300" />
                )}
              </div>
            );
          })}
        </nav>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-44 overflow-hidden opacity-90">
          <div
            className="absolute -bottom-8 -left-8 size-48 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(45,106,79,0.18) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute bottom-6 left-10 size-28 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(232,192,122,0.35) 0%, transparent 70%)",
            }}
          />
          <Bird
            className="absolute bottom-10 left-16 size-16 text-[#2d6a4f]/25"
            strokeWidth={1.25}
          />
        </div>
      </aside>

      {/* Main */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between px-6 py-5 md:px-12">
          <div className="flex items-center gap-2 md:hidden">
            <span className="flex size-8 items-center justify-center rounded-full bg-[#2d6a4f] text-xs font-semibold text-white">
              K
            </span>
            <span className="font-[family-name:var(--font-display)] text-lg">
              Kuku Farm
            </span>
          </div>
          <p className="ml-auto text-sm text-[#6b7c72]">
            Having troubles?{" "}
            <a
              href="mailto:hello@kukufarm.local"
              className="font-medium text-[#2d6a4f] hover:underline"
            >
              Get Help
            </a>
          </p>
        </header>

        {/* Mobile step dots */}
        <div className="flex gap-2 px-6 md:hidden">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i <= step ? "bg-[#2d6a4f]" : "bg-[#d5e0d8]"
              )}
            />
          ))}
        </div>

        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 pb-10 pt-8 md:px-12 md:pt-16">
          <div
            key={step}
            className="animate-in fade-in slide-in-from-bottom-2 duration-400 fill-mode-both"
          >
            {step === 0 && (
              <>
                <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-[#1a2e1c] md:text-5xl">
                  {creatingAnother
                    ? "Name your new farm"
                    : userName
                      ? `Welcome, ${userName.split(" ")[0]}`
                      : "Name your farm"}
                </h1>
                <p className="mt-3 max-w-md text-[#6b7c72]">
                  {creatingAnother
                    ? "You’ll switch to this farm after it’s created."
                    : "This is how your farm appears in the app and on your public shop."}
                </p>
                <div className="mt-10">
                  <label
                    htmlFor="farm-name"
                    className="text-xs font-semibold tracking-[0.14em] text-[#6b7c72] uppercase"
                  >
                    Farm name
                  </label>
                  <input
                    id="farm-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && canNext) goNext();
                    }}
                    placeholder="Green Valley Poultry"
                    autoFocus
                    className="mt-3 w-full border-0 border-b-2 border-[#c5d4cb] bg-transparent pb-3 text-2xl text-[#1a2e1c] outline-none transition-colors placeholder:text-[#b0c0b6] focus:border-[#2d6a4f] md:text-3xl"
                  />
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-[#1a2e1c] md:text-5xl">
                  Choose your currency
                </h1>
                <p className="mt-3 max-w-lg text-[#6b7c72]">
                  Used for sales, expenses, invoices, and your storefront prices.
                </p>
                <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {CURRENCIES.map((c) => {
                    const selected = currency === c.code;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => setCurrency(c.code)}
                        className={cn(
                          "group flex flex-col items-start rounded-2xl border bg-white p-5 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                          selected
                            ? "border-[#2d6a4f] ring-2 ring-[#2d6a4f]/25"
                            : "border-[#e2ebe5]"
                        )}
                      >
                        <span className="flex size-14 items-center justify-center rounded-xl bg-[#eef5f0] font-[family-name:var(--font-display)] text-lg font-semibold text-[#2d6a4f] transition-colors group-hover:bg-[#e0eee5]">
                          {c.code.slice(0, 2)}
                        </span>
                        <span className="mt-5 text-xs font-semibold tracking-[0.14em] text-[#1a2e1c] uppercase">
                          {c.code}
                        </span>
                        <span className="mt-1 text-sm text-[#6b7c72]">{c.name}</span>
                        <span className="mt-0.5 text-xs text-[#9aada2]">{c.hint}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-[#1a2e1c] md:text-5xl">
                  Choose your region
                </h1>
                <p className="mt-3 max-w-lg text-[#6b7c72]">
                  Sets the timezone for egg logs, expenses, and reports.
                </p>
                <div className="mt-10 grid gap-4 sm:grid-cols-2">
                  {REGIONS.map((r) => {
                    const selected = timezone === r.timezone;
                    return (
                      <button
                        key={r.timezone}
                        type="button"
                        onClick={() => setTimezone(r.timezone)}
                        className={cn(
                          "flex flex-col items-start rounded-2xl border bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                          selected
                            ? "border-[#2d6a4f] ring-2 ring-[#2d6a4f]/25"
                            : "border-[#e2ebe5]"
                        )}
                      >
                        <span className="flex size-14 items-center justify-center rounded-xl bg-[#eef5f0] text-[#2d6a4f]">
                          <Warehouse className="size-7" strokeWidth={1.5} />
                        </span>
                        <span className="mt-5 text-xs font-semibold tracking-[0.14em] text-[#1a2e1c] uppercase">
                          {r.label}
                        </span>
                        <span className="mt-1 text-sm text-[#6b7c72]">{r.hint}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-[#1a2e1c] md:text-5xl">
                  Ready to launch
                </h1>
                <p className="mt-3 max-w-lg text-[#6b7c72]">
                  Confirm your farm details. You can change these later in settings.
                </p>
                <div className="mt-10 overflow-hidden rounded-2xl border border-[#e2ebe5] bg-white shadow-sm">
                  <div className="border-b border-[#eef3f0] bg-[#f7faf8] px-6 py-4">
                    <p className="font-[family-name:var(--font-display)] text-2xl text-[#1a2e1c]">
                      {name.trim()}
                    </p>
                  </div>
                  <dl className="grid gap-4 px-6 py-5 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold tracking-[0.12em] text-[#9aada2] uppercase">
                        Currency
                      </dt>
                      <dd className="mt-1 text-[#1a2e1c]">{currency}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold tracking-[0.12em] text-[#9aada2] uppercase">
                        Region
                      </dt>
                      <dd className="mt-1 text-[#1a2e1c]">
                        {REGIONS.find((r) => r.timezone === timezone)?.label ??
                          timezone}
                      </dd>
                    </div>
                  </dl>
                  <div className="flex gap-6 border-t border-[#eef3f0] px-6 py-4 text-sm text-[#6b7c72]">
                    <span className="flex items-center gap-2">
                      <Egg className="size-4 text-[#2d6a4f]" /> Track eggs
                    </span>
                    <span className="flex items-center gap-2">
                      <Bird className="size-4 text-[#2d6a4f]" /> Manage flocks
                    </span>
                    <span className="flex items-center gap-2">
                      <Warehouse className="size-4 text-[#2d6a4f]" /> Sell online
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="mt-auto flex items-center justify-between gap-4 pt-12">
            {step > 0 ? (
              <button
                type="button"
                onClick={goBack}
                className="text-sm font-medium text-[#6b7c72] transition hover:text-[#1a2e1c]"
              >
                Back
              </button>
            ) : creatingAnother ? (
              <Link
                href="/app"
                className="text-sm font-medium text-[#6b7c72] hover:text-[#1a2e1c]"
              >
                Cancel
              </Link>
            ) : (
              <span />
            )}

            {step < STEPS.length - 1 ? (
              <button
                type="button"
                disabled={!canNext}
                onClick={goNext}
                className="inline-flex items-center gap-2 rounded-full bg-[#2d6a4f] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#245a42] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue
                <ArrowRight className="size-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={pending}
                onClick={submit}
                className="inline-flex items-center gap-2 rounded-full bg-[#2d6a4f] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#245a42] disabled:opacity-60"
              >
                {pending ? "Creating…" : "Create farm"}
                <ArrowRight className="size-4" />
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
