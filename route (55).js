import { NextResponse } from "next/server";
import { sessionClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function who() {
  const sb = sessionClient(); if (!sb) return {};
  const { data: { user } } = await sb.auth.getUser();
  return { sb, user };
}
// GET: the logged-in customer's saved product ids (401 if not logged in)
export async function GET() {
  const { sb, user } = await who(); if (!user) return NextResponse.json({ error: "no" }, { status: 401 });
  const { data } = await sb.from("wishlist").select("product_id").eq("user_id", user.id);
  return NextResponse.json({ ids: (data || []).map((r) => r.product_id), email: user.email });
}
// POST { ids: [...], on: true|false }
export async function POST(req) {
  const { sb, user } = await who(); if (!user) return NextResponse.json({ error: "no" }, { status: 401 });
  const { ids = [], on = true } = await req.json().catch(() => ({}));
  const list = (Array.isArray(ids) ? ids : []).slice(0, 200);
  if (on) { if (list.length) await sb.from("wishlist").upsert(list.map((p) => ({ user_id: user.id, product_id: p })), { onConflict: "user_id,product_id" }); }
  else await sb.from("wishlist").delete().eq("user_id", user.id).in("product_id", list);
  return NextResponse.json({ ok: true });
}
