export function ClerkSetupNotice() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#1a2e1c] px-6 text-[#f4f1ea]">
      <div className="max-w-lg space-y-4">
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
          Add your Clerk keys
        </h1>
        <p className="text-[#f4f1ea]/85">
          Auth will not start until{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5 text-sm">
            .env.local
          </code>{" "}
          has real Clerk keys (not placeholders).
        </p>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-[#f4f1ea]/85">
          <li>
            Open{" "}
            <a
              className="underline"
              href="https://dashboard.clerk.com"
              target="_blank"
              rel="noreferrer"
            >
              dashboard.clerk.com
            </a>{" "}
            and create (or open) an application.
          </li>
          <li>
            Copy the <strong>Publishable key</strong> and{" "}
            <strong>Secret key</strong>.
          </li>
          <li>
            Set them in <code className="rounded bg-white/10 px-1">.env.local</code>:
            <pre className="mt-2 overflow-x-auto rounded-lg bg-black/30 p-3 text-xs leading-relaxed">
{`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...`}
            </pre>
          </li>
          <li>
            Restart <code className="rounded bg-white/10 px-1">npm run dev</code>.
          </li>
        </ol>
      </div>
    </main>
  );
}
