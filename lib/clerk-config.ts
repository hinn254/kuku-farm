/**
 * Clerk rejects placeholder / empty keys at runtime.
 * A publishable key looks like: pk_test_... or pk_live_... (long base64-ish suffix).
 */
export function isClerkConfigured(): boolean {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim() ?? "";
  const secret = process.env.CLERK_SECRET_KEY?.trim() ?? "";
  if (!key || !secret) return false;
  if (key.includes("placeholder") || secret.includes("placeholder")) {
    return false;
  }
  if (!/^pk_(test|live)_[A-Za-z0-9_-]{20,}$/.test(key)) return false;
  if (!/^sk_(test|live)_[A-Za-z0-9_-]{20,}$/.test(secret)) return false;
  return true;
}
