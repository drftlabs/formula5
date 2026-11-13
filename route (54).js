import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabase/server";

// Order lookup for the "Track order" window: order number + the email used at checkout.
export async function POST(req) {
  let b = {}; try { b = await req.json(); } catch {}
  const num = String(b.order || "").trim().toUpperCase().slice(0, 20), email = String(b.email || "").trim().toLowerCase().slice(0, 200);
  if (!num || !email) return NextResponse.json({ error: "Enter your order number and email." }, { status: 400 });
  const sb = serviceClient();
  if (!sb) return NextResponse.json({ error: "Order tracking isn't available right now." }, { status: 503 });
  const { data } = await sb.from("orders").select("order_number,status,created_at,items,total,courier,tracking_number,tracking_url,email").eq("order_number", num).maybeSingle();
  if (!data || String(data.email || "").toLowerCase() !== email || data.status === "pending_payment") return NextResponse.json({ error: "We couldn't find a matching order. Check the order number and email." }, { status: 404 });
  const { email: _e, ...order } = data;
  return NextResponse.json({ order });
}
