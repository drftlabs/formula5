import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const cut = (v, n = 120) => String(v ?? "").trim().slice(0, n);

// Remembers a checkout in progress (once the visitor has typed a valid email) so abandoned carts can be followed up.
export async function POST(req) {
  try {
    const sb = serviceClient(); if (!sb) return NextResponse.json({ ok: false });
    let b = {}; try { b = JSON.parse(await req.text()); } catch {}
    const sid = cut(b.sid, 60), email = cut(b.email, 200).toLowerCase();
    if (!sid || !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ ok: false });
    const items = (Array.isArray(b.items) ? b.items : []).slice(0, 20).map((i) => ({ id: cut(i.id, 60), name: cut(i.name, 120), size: cut(i.size, 8), qty: Math.max(1, Math.min(10, parseInt(i.qty) || 1)), price: Math.max(0, parseInt(i.price) || 0), image: cut(i.image, 300), color: cut(i.color || i.colorName, 40) }));
    if (!items.length) return NextResponse.json({ ok: false });
    const row = { sid, email, name: cut(b.name, 120) || null, phone: cut(b.phone, 15).replace(/[^\d+]/g, "") || null, city: cut(b.city, 80) || null, state: cut(b.state, 60) || null, pin: cut(b.pin, 6) || null, items, total: items.reduce((t, i) => t + i.price * i.qty, 0), updated_at: new Date().toISOString() };
    await sb.from("checkouts").upsert(row, { onConflict: "sid" });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ ok: false }); }
}
