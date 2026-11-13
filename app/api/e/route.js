import { NextResponse } from "next/server";
import { serviceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
const BOT = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python|axios|node-fetch/i;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const cut = (v, n = 120) => String(v ?? "").slice(0, n);
const dec = (v) => { try { return decodeURIComponent(v || ""); } catch { return v || ""; } };
const done = () => new NextResponse(null, { status: 204 });

// First-party traffic events. No cookies, no IP stored: only the city/region Vercel derives from the request.
export async function POST(req) {
  try {
    const ua = req.headers.get("user-agent") || "";
    if (!ua || BOT.test(ua)) return done();
    let b = {}; try { b = JSON.parse(await req.text()); } catch { return done(); }
    const sb = serviceClient(); if (!sb) return done();
    const sid = cut(b.sid, 60), vid = cut(b.vid, 60), t = b.t;
    if (!sid) return done();
    if (t === "leave") {
      if (UUID.test(b.pid || "")) await sb.from("site_events").update({ duration: Math.max(0, Math.min(1800, parseInt(b.dur) || 0)) }).eq("id", b.pid);
      return done();
    }
    if (!["view", "cart", "checkout"].includes(t)) return done();
    const path = cut(b.path, 200);
    if (!path.startsWith("/") || path.startsWith("/admin") || path.startsWith("/api")) return done();
    let ref = ""; try { ref = b.ref ? new URL(b.ref).hostname.replace(/^www\./, "") : ""; } catch {}
    if (ref.endsWith("taeken.in")) ref = "";
    const h = req.headers;
    const w = parseInt(b.w) || 0;
    const device = /ipad|tablet/i.test(ua) ? "Tablet" : /mobi|android|iphone/i.test(ua) ? "Mobile" : w && w < 700 ? "Mobile" : "Desktop";
    const row = {
      sid, vid, type: t, path, ref: cut(ref, 80), source: cut(b.utm || ref, 60) || null, device,
      city: cut(dec(h.get("x-vercel-ip-city")), 60) || null, region: cut(h.get("x-vercel-ip-country-region"), 20) || null, country: cut(h.get("x-vercel-ip-country"), 4) || null,
    };
    if (t === "view" && UUID.test(b.pid || "")) row.id = b.pid;
    await sb.from("site_events").insert(row);
  } catch {}
  return done();
}
