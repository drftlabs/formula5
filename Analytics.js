"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { ping, ids } from "@/lib/analytics";

// Counts page views and time on page for the admin traffic report. Renders nothing.
export default function Analytics() {
  const path = usePathname();
  const cur = useRef({ pid: "", t0: 0, acc: 0, on: false });
  const flush = () => { const c = cur.current; if (!c.pid) return; if (c.on) { c.acc += Date.now() - c.t0; c.t0 = Date.now(); } const dur = Math.round(c.acc / 1000); if (dur > 0) ping({ t: "leave", pid: c.pid, dur }); };
  useEffect(() => {
    if (!path || path.startsWith("/admin")) return;
    flush();
    const pid = (crypto.randomUUID ? crypto.randomUUID() : ids().sid + Date.now());
    cur.current = { pid, t0: Date.now(), acc: 0, on: document.visibilityState !== "hidden" };
    let q = ""; try { q = new URLSearchParams(location.search).get("utm_source") || ""; } catch {}
    ping({ t: "view", pid, path, ref: document.referrer || "", utm: q, w: window.innerWidth });
  }, [path]); // eslint-disable-line
  useEffect(() => {
    const hide = () => { const c = cur.current; if (c.on) { c.acc += Date.now() - c.t0; c.on = false; } flush(); };
    const vis = () => { if (document.visibilityState === "hidden") hide(); else { const c = cur.current; c.t0 = Date.now(); c.on = true; } };
    document.addEventListener("visibilitychange", vis); window.addEventListener("pagehide", hide);
    return () => { document.removeEventListener("visibilitychange", vis); window.removeEventListener("pagehide", hide); };
  }, []); // eslint-disable-line
  return null;
}
