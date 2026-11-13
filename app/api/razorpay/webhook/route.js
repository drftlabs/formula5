import { NextResponse } from "next/server";
import crypto from "crypto";
import { serviceClient } from "@/lib/supabase/server";
import { markPaid } from "@/lib/orders";

export const dynamic = "force-dynamic";

// Safety net: Razorpay calls this even if the customer closes the tab right after paying.
// Dashboard → Webhooks → URL: https://www.taeken.in/api/razorpay/webhook, events: payment.captured, order.paid
export async function POST(req) {
  const raw = await req.text();
  const sig = req.headers.get("x-razorpay-signature") || "";
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET || "").update(raw).digest("hex");
  const a = Buffer.from(expected), b = Buffer.from(sig);
  if (!process.env.RAZORPAY_WEBHOOK_SECRET || a.length !== b.length || !crypto.timingSafeEqual(a, b)) return NextResponse.json({ error: "bad signature" }, { status: 400 });
  const evt = JSON.parse(raw);
  if (!["payment.captured", "order.paid"].includes(evt.event)) return NextResponse.json({ ok: true });
  const pay = evt.payload?.payment?.entity; const rzpOrderId = pay?.order_id || evt.payload?.order?.entity?.id;
  const sb = serviceClient(); if (!rzpOrderId || !sb) return NextResponse.json({ ok: true });
  const { data: o } = await sb.from("orders").select("id").eq("razorpay_order_id", rzpOrderId).maybeSingle();
  if (o) await markPaid(o.id, pay?.id || "webhook");
  return NextResponse.json({ ok: true });
}
