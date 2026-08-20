import { createHmac, timingSafeEqual } from "crypto";

const PAYSTACK_BASE = "https://api.paystack.co";

export type PaystackInitResult = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

export function toPaystackAmount(amount: number | string): number {
  const n = typeof amount === "string" ? Number(amount) : amount;
  return Math.round(n * 100);
}

export async function initializePaystackTransaction(opts: {
  secretKey: string;
  email: string;
  amount: number | string;
  currency: string;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
  subaccount?: string | null;
}): Promise<PaystackInitResult> {
  const body: Record<string, unknown> = {
    email: opts.email,
    amount: toPaystackAmount(opts.amount),
    currency: opts.currency,
    reference: opts.reference,
    callback_url: opts.callbackUrl,
    metadata: opts.metadata,
  };
  if (opts.subaccount) body.subaccount = opts.subaccount;

  const res = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${opts.secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as {
    status: boolean;
    message: string;
    data?: PaystackInitResult;
  };

  if (!res.ok || !json.status || !json.data) {
    throw new Error(json.message || "Paystack initialize failed");
  }

  return json.data;
}

export function verifyPaystackSignature(
  rawBody: string,
  signature: string | null,
  secretKey: string
): boolean {
  if (!signature) return false;
  const hash = createHmac("sha512", secretKey)
    .update(rawBody)
    .digest("hex");
  try {
    return timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
  } catch {
    return false;
  }
}
