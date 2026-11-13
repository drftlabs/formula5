import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabase/server";
import { cleanPhone, validPhone, hashCode, newCode, sendWhatsAppCode, waConfigured } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";
const COOLDOWN = 30; // seconds between codes

export async function POST(req) {
  const sb = serviceClient();
  if (!sb) return NextResponse.json({ error: "The store backend isn't connected yet." }, { status: 503 });
  const body = await req.json().catch(() => ({}));
  const phone = cleanPhone(body.phone);
  if (!validPhone(phone)) return NextResponse.json({ error: "Enter a valid 10-digit mobile number." }, { status: 400 });
  const { data: row } = await sb.from("wa_otps").select("*").eq("phone", phone).maybeSingle();
  if (row?.sent_at) {
    const wait = COOLDOWN - Math.floor((Date.now() - new Date(row.sent_at).getTime()) / 1000);
    if (wait > 0) return NextResponse.json({ error: `Please wait ${wait}s before asking for a new code.`, wait }, { status: 429 });
  }
  const test = process.env.WA_TEST_CODE; // optional: fixed code for testing before WhatsApp is connected
  if (!waConfigured() && !test) return NextResponse.json({ error: "WhatsApp isn't connected yet." }, { status: 503 });
  const code = !waConfigured() && test ? String(test).slice(0, 4) : newCode();
  const { error } = await sb.from("wa_otps").upsert({ phone, code_hash: hashCode(phone, code), expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), attempts: 0, sent_at: new Date().toISOString(), verified_until: null });
  if (error) return NextResponse.json({ error: "Setup incomplete: run supabase/migration_9.sql." }, { status: 500 });
  if (waConfigured()) { try { await sendWhatsAppCode(phone, code); } catch (e) { return NextResponse.json({ error: `Couldn't send the WhatsApp message${e?.meta ? ` (Meta ${e.meta}: ${String(e.message).slice(0, 140)})` : ""}. Please try again.` }, { status: 502 }); } }
  return NextResponse.json({ ok: true });
}
