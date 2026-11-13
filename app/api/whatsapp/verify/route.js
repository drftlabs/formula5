import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabase/server";
import { cleanPhone, hashCode } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const sb = serviceClient();
  if (!sb) return NextResponse.json({ error: "The store backend isn't connected yet." }, { status: 503 });
  const body = await req.json().catch(() => ({}));
  const phone = cleanPhone(body.phone), code = String(body.code || "").replace(/\D/g, "").slice(0, 4);
  const { data: row } = await sb.from("wa_otps").select("*").eq("phone", phone).maybeSingle();
  if (!row || !row.code_hash || new Date(row.expires_at) < new Date()) return NextResponse.json({ error: "That code has expired. Tap Resend code." }, { status: 400 });
  if (row.attempts >= 5) return NextResponse.json({ error: "Too many tries. Tap Resend code for a new one." }, { status: 429 });
  if (row.code_hash !== hashCode(phone, code)) {
    await sb.from("wa_otps").update({ attempts: row.attempts + 1 }).eq("phone", phone);
    return NextResponse.json({ error: "That code isn't right. Check WhatsApp and try again." }, { status: 400 });
  }
  await sb.from("wa_otps").update({ verified_until: new Date(Date.now() + 30 * 60 * 1000).toISOString(), code_hash: null }).eq("phone", phone);
  return NextResponse.json({ ok: true });
}
