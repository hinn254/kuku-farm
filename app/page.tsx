import Link from "next/link";
import { Show, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#1a2e1c] text-[#f4f1ea]">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 60% at 70% 20%, #3d7a52 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 10% 80%, #c4a574 0%, transparent 50%)",
        }}
      />
      <header className="relative z-10 flex items-center justify-between px-6 py-5 md:px-12">
        <p className="font-[family-name:var(--font-display)] text-2xl tracking-tight">
          Kuku Farm
        </p>
        <div className="flex items-center gap-3">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <Button
                variant="outline"
                className="border-white/30 bg-transparent text-white hover:bg-white/10"
              >
                Sign in
              </Button>
            </SignInButton>
            <Button
              render={<Link href="/sign-up" />}
              className="bg-[#e8c07a] text-[#1a2e1c] hover:bg-[#f0d49a]"
            >
              Start free
            </Button>
          </Show>
          <Show when="signed-in">
            <Button
              render={<Link href="/app" />}
              className="bg-[#e8c07a] text-[#1a2e1c] hover:bg-[#f0d49a]"
            >
              Open dashboard
            </Button>
          </Show>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex max-w-5xl flex-col gap-8 px-6 pb-24 pt-16 md:px-12 md:pt-24">
        <h1 className="max-w-3xl font-[family-name:var(--font-display)] text-5xl leading-[1.05] tracking-tight md:text-7xl">
          Kuku Farm
        </h1>
        <p className="max-w-xl text-lg text-[#f4f1ea]/85 md:text-xl">
          Track flocks through every growth stage, log eggs and vaccines, and
          sell produce from a shop that looks like yours.
        </p>
        <div className="flex flex-wrap gap-3">
          <Show when="signed-out">
            <Button
              size="lg"
              render={<Link href="/sign-up" />}
              className="bg-[#e8c07a] text-[#1a2e1c] hover:bg-[#f0d49a]"
            >
              Create your farm
            </Button>
          </Show>
          <Show when="signed-in">
            <Button
              size="lg"
              render={<Link href="/app" />}
              className="bg-[#e8c07a] text-[#1a2e1c] hover:bg-[#f0d49a]"
            >
              Go to app
            </Button>
          </Show>
        </div>
      </main>
    </div>
  );
}
