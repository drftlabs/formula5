import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabase/server";
import { checkDiscount } from "@/lib/pricing";

export const dynamic = "force-dynamic";

// Lets the checkout page check a code and show the saving. (The real price is re-checked again when the order is created.)
export async function POST(req) {
  const sb = serviceClient(); const { code, subtotal } = await req.json().catch(() => ({}));
  const c = String(code || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  if (!sb || !c) return NextResponse.json({ ok: false, error: "Enter a code." });
  const { data: d } = await sb.from("discounts").select("*").eq("code", c).maybeSingle();
  return NextResponse.json(checkDiscount(d, Number(subtotal) || 0));
}
