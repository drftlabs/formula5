import { NextResponse } from "next/server";
import crypto from "crypto";
import { serviceClient } from "@/lib/supabase/server";
import { markPaid } from "@/lib/orders";

export const dynamic = "force-dynamic";

// Step 2: the browser reports a successful payment; we verify Razorpay's signature before trusting it.
export async function POST(req) {
  const sb = serviceClient(); if (!sb) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const { order_id, razorpay_payment_id, razorpay_order_id, razorpay_signature } = await req.json().catch(() => ({}));
  if (!order_id || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "").update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
  const a = Buffer.from(expected), b = Buffer.from(String(razorpay_signature));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return NextResponse.json({ error: "Payment could not be verified." }, { status: 400 });
  const { data: o } = await sb.from("orders").select("id,razorpay_order_id").eq("id", order_id).maybeSingle();
  if (!o || o.razorpay_order_id !== razorpay_order_id) return NextResponse.json({ error: "Order mismatch" }, { status: 400 });
  const r = await markPaid(order_id, razorpay_payment_id);
  if (r.error) return NextResponse.json({ error: r.error }, { status: 500 });
  return NextResponse.json({ ok: true, orderNumber: r.order.order_number });
}
