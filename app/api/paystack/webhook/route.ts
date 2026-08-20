import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { farms, orders } from "@/db/schema";
import { markOrderPaidFromWebhook } from "@/app/actions/checkout";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-paystack-signature");

  let payload: {
    event?: string;
    data?: { reference?: string; metadata?: { farmId?: string } };
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (payload.event !== "charge.success") {
    return NextResponse.json({ received: true });
  }

  const reference = payload.data?.reference;
  if (!reference) {
    return NextResponse.json({ error: "Missing reference" }, { status: 400 });
  }

  const order = await db.query.orders.findFirst({
    where: eq(orders.paystackReference, reference),
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const farm = await db.query.farms.findFirst({
    where: eq(farms.id, order.farmId),
  });
  if (!farm?.paystackSecretKey) {
    return NextResponse.json({ error: "Farm not configured" }, { status: 400 });
  }

  const hash = createHmac("sha512", farm.paystackSecretKey)
    .update(rawBody)
    .digest("hex");
  const valid =
    !!signature &&
    (() => {
      try {
        return timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
      } catch {
        return false;
      }
    })();

  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  await markOrderPaidFromWebhook({
    reference,
    secretKeyUsed: farm.paystackSecretKey,
  });

  return NextResponse.json({ received: true });
}
