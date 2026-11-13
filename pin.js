import { matchState } from "./format";

const cache = new Map();
// Looks up an Indian pin code (free public service). Returns { city, state, areas[] } or null. Never throws.
export async function lookupPin(pin) {
  if (!/^\d{6}$/.test(pin)) return null;
  if (cache.has(pin)) return cache.get(pin);
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 6000);
  try {
    const r = await fetch(`https://api.postalpincode.in/pincode/${pin}`, { signal: ctl.signal });
    const d = await r.json(); const po = d?.[0]?.PostOffice;
    if (d?.[0]?.Status !== "Success" || !po?.length) { cache.set(pin, null); return null; }
    const out = { city: po[0].District || po[0].Block || po[0].Division, state: matchState(po[0].State), areas: [...new Set(po.map((x) => x.Name))] };
    cache.set(pin, out); return out;
  } catch { return null; } finally { clearTimeout(t); }
}
