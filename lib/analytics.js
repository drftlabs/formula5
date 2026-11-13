// Client-side helpers for first-party traffic stats (page views, add to bag, checkout). Never throws.
const rnd = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "x" + Math.random().toString(36).slice(2) + Date.now().toString(36));
export function ids() {
  let vid = "", sid = "";
  try { vid = localStorage.getItem("tk_vid") || ""; if (!vid) { vid = rnd(); localStorage.setItem("tk_vid", vid); } } catch {}
  try { sid = sessionStorage.getItem("tk_sid") || ""; if (!sid) { sid = rnd(); sessionStorage.setItem("tk_sid", sid); } } catch { sid = vid; }
  return { vid, sid };
}
export function ping(body) {
  try {
    if (typeof window === "undefined") return;
    const data = JSON.stringify({ ...ids(), ...body });
    if (navigator.sendBeacon) { if (navigator.sendBeacon("/api/e", new Blob([data], { type: "text/plain" }))) return; }
    fetch("/api/e", { method: "POST", body: data, keepalive: true, headers: { "Content-Type": "text/plain" } }).catch(() => {});
  } catch {}
}
