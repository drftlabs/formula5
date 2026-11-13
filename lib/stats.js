import { VALID, isCod, paidOnline } from "./orderMeta";

// ---------- IST date helpers (the shop runs on Indian time; Vercel runs on UTC) ----------
const IST = 330 * 60000, DAY = 864e5;
export const istDay = (d) => new Date(new Date(d).getTime() + IST).toISOString().slice(0, 10);
export const dayStart = (ymd) => new Date(Date.parse(ymd + "T00:00:00Z") - IST);
export const addDays = (ymd, n) => new Date(Date.parse(ymd + "T00:00:00Z") + n * DAY).toISOString().slice(0, 10);
export const diffDays = (a, b) => Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / DAY);
const okDay = (s) => /^\d{4}-\d{2}-\d{2}$/.test(String(s || "")) && !isNaN(Date.parse(s + "T00:00:00Z"));
const monthStart = (ymd) => ymd.slice(0, 8) + "01";
const weekStart = (ymd) => { const d = new Date(ymd + "T00:00:00Z"); return addDays(ymd, -((d.getUTCDay() + 6) % 7)); };   // Monday
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const dayLabel = (ymd) => `${+ymd.slice(8)} ${MON[+ymd.slice(5, 7) - 1]}`;
export const fullDayLabel = (ymd) => `${dayLabel(ymd)} ${ymd.slice(0, 4)}`;

export const PRESETS = [["today", "Today"], ["yesterday", "Yesterday"], ["7d", "7 days"], ["30d", "30 days"], ["90d", "90 days"], ["mtd", "This month"], ["lastmonth", "Last month"], ["year", "This year"]];

/** Turns ?range=&from=&to=&compare=&cfrom=&cto=&by= into concrete IST days. All ranges are inclusive. */
export function resolveRange(sp = {}) {
  const today = istDay(Date.now());
  let preset = PRESETS.some((p) => p[0] === sp.range) ? sp.range : sp.range === "custom" && okDay(sp.from) ? "custom" : "30d";
  let from, to = today;
  if (preset === "today") from = today;
  else if (preset === "yesterday") from = to = addDays(today, -1);
  else if (preset === "7d") from = addDays(today, -6);
  else if (preset === "30d") from = addDays(today, -29);
  else if (preset === "90d") from = addDays(today, -89);
  else if (preset === "mtd") from = monthStart(today);
  else if (preset === "lastmonth") { to = addDays(monthStart(today), -1); from = monthStart(to); }
  else if (preset === "year") from = today.slice(0, 4) + "-01-01";
  else { from = sp.from; to = okDay(sp.to) ? sp.to : today; if (from > to) [from, to] = [to, from]; }
  if (diffDays(from, to) > 730) from = addDays(to, -730);
  const days = diffDays(from, to) + 1;
  let compare = ["none", "prev", "custom"].includes(sp.compare) ? sp.compare : "prev", cmp = null;
  if (compare === "custom" && okDay(sp.cfrom) && okDay(sp.cto)) { cmp = sp.cfrom <= sp.cto ? { from: sp.cfrom, to: sp.cto } : { from: sp.cto, to: sp.cfrom }; }
  else if (compare === "custom") compare = "prev";
  if (compare === "prev") { const t = addDays(from, -1); cmp = { from: addDays(t, -(days - 1)), to: t }; }
  if (compare === "none") cmp = null;
  const by = ["day", "week", "month"].includes(sp.by) ? sp.by : days <= 31 ? "day" : days <= 120 ? "week" : "month";
  return { preset, from, to, days, compare, cmp, by, today };
}
export const rangeLabel = (r) => (r.from === r.to ? fullDayLabel(r.from) : `${fullDayLabel(r.from)} → ${fullDayLabel(r.to)}`);

// ---------- paging (the database returns at most 1000 rows per request) ----------
export async function fetchAll(make, max = 60) {
  const rows = [];
  for (let i = 0; i < max; i++) {
    const { data, error } = await make().range(i * 1000, i * 1000 + 999);
    if (error) return { rows, error };
    rows.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return { rows };
}

const ORDER_COLS = "id,order_number,created_at,total,subtotal,discount,discount_code,payment_method,amount_paid,amount_due,status,email,phone,name,shipping_address";
export async function loadOrders(sb, sinceISO) {
  const q = (cols) => () => { let b = sb.from("orders").select(cols).neq("status", "pending_payment").order("created_at", { ascending: false }); if (sinceISO) b = b.gte("created_at", sinceISO); return b; };
  let r = await fetchAll(q(ORDER_COLS));
  if (r.error) r = await fetchAll(q("*"));       // older database without the newer columns
  return r.rows;
}
export async function loadEvents(sb, sinceISO, untilISO) {
  const { rows, error } = await fetchAll(() => sb.from("site_events").select("id,created_at,sid,vid,type,path,city,device,source,duration").gte("created_at", sinceISO).lt("created_at", untilISO).order("created_at", { ascending: false }), 80);
  return { rows, missing: !!error };
}

// ---------- aggregation ----------
const inDays = (iso, from, to) => { const d = istDay(iso); return d >= from && d <= to; };
const sum = (a, f) => a.reduce((t, x) => t + (Number(f(x)) || 0), 0);

export function orderStats(orders) {
  const live = orders.filter(VALID), cod = live.filter(isCod), pre = live.filter((o) => !isCod(o));
  const disc = live.filter((o) => Number(o.discount) > 0);
  return {
    count: live.length, sales: sum(live, (o) => o.total), aov: live.length ? Math.round(sum(live, (o) => o.total) / live.length) : 0,
    prepaidCount: pre.length, prepaidSales: sum(pre, (o) => o.total), codCount: cod.length, codSales: sum(cod, (o) => o.total),
    collectedOnline: sum(live, paidOnline), codToCollect: sum(cod, (o) => (o.status === "cancelled" ? 0 : o.amount_due)),
    discountCount: disc.length, discountTotal: sum(disc, (o) => o.discount), cancelled: orders.filter((o) => o.status === "cancelled").length,
    units: live.reduce((t, o) => t + (o.items ? o.items.reduce((u, i) => u + i.qty, 0) : 0), 0),
  };
}

export function eventStats(events) {
  const views = events.filter((e) => e.type === "view");
  const sess = new Map();           // sid -> {views, dur, first}
  for (const e of events) {
    if (!e.sid) continue;
    const s = sess.get(e.sid) || { views: 0, dur: 0, first: e.created_at, city: "", device: "", source: "" };
    if (e.type === "view") { s.views++; s.dur += Math.min(Number(e.duration) || 0, 1800); }
    if (e.created_at < s.first) s.first = e.created_at;
    s.city = s.city || e.city || ""; s.device = s.device || e.device || ""; s.source = s.source || e.source || "";
    sess.set(e.sid, s);
  }
  const sessions = [...sess.values()], n = sessions.length;
  const cartS = new Set(events.filter((e) => e.type === "cart" && e.sid).map((e) => e.sid)), coS = new Set(events.filter((e) => e.type === "checkout" && e.sid).map((e) => e.sid));
  const bounced = [...sess.entries()].filter(([sid, s]) => s.views <= 1 && !cartS.has(sid) && !coS.has(sid)).length;
  const tally = (arr, f, k = 8) => { const m = new Map(); for (const x of arr) { const key = f(x) || "Unknown"; m.set(key, (m.get(key) || 0) + 1); } return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, k); };
  const pages = new Map();
  for (const v of views) { const p = pages.get(v.path) || { path: v.path, views: 0, dur: 0 }; p.views++; p.dur += Math.min(Number(v.duration) || 0, 1800); pages.set(v.path, p); }
  const hours = Array(24).fill(0);
  for (const v of views) hours[new Date(new Date(v.created_at).getTime() + IST).getUTCHours()]++;
  const withDur = sessions.filter((s) => s.dur > 0);
  return {
    sessions: n, visitors: new Set(events.map((e) => e.vid).filter(Boolean)).size, pageviews: views.length,
    avgDur: withDur.length ? Math.round(sum(withDur, (s) => s.dur) / withDur.length) : 0,
    bounce: n ? Math.round((bounced / n) * 100) : 0,
    cart: cartS.size, checkout: coS.size,
    topPages: [...pages.values()].sort((a, b) => b.views - a.views).slice(0, 10).map((p) => ({ ...p, avg: p.views ? Math.round(p.dur / p.views) : 0 })),
    cities: tally(sessions, (s) => s.city, 10), devices: tally(sessions, (s) => s.device, 4), sources: tally(sessions, (s) => s.source || "Direct", 8), hours,
  };
}

/** Buckets for the sales chart: one per day / ISO week (Mon) / month, including empty ones. */
export function buckets(from, to, by) {
  const keyOf = (d) => (by === "month" ? monthStart(d) : by === "week" ? weekStart(d) : d);
  const out = [], seen = new Set();
  for (let d = from; d <= to; d = addDays(d, 1)) { const k = keyOf(d); if (!seen.has(k)) { seen.add(k); out.push(k); } }
  return { keyOf, keys: out, label: (k) => (by === "month" ? `${MON[+k.slice(5, 7) - 1]} ${k.slice(0, 4)}` : by === "week" ? `Wk ${dayLabel(k)}` : dayLabel(k)) };
}
export function series(orders, from, to, by) {
  const b = buckets(from, to, by), m = new Map(b.keys.map((k) => [k, { key: k, label: b.label(k), orders: 0, sales: 0, prepaid: 0, cod: 0, collected: 0 }]));
  for (const o of orders.filter(VALID)) {
    const d = istDay(o.created_at); if (d < from || d > to) continue;
    const s = m.get(b.keyOf(d)); if (!s) continue;
    s.orders++; s.sales += o.total; s.collected += paidOnline(o); isCod(o) ? (s.cod += o.total) : (s.prepaid += o.total);
  }
  return b.keys.map((k) => m.get(k));
}
/** Fixed look-back tables: the last N weeks / months, independent of the chosen range. */
export function lookback(orders, by, n) {
  const today = istDay(Date.now());
  const from = by === "month" ? (() => { let d = monthStart(today); for (let i = 1; i < n; i++) d = monthStart(addDays(d, -1)); return d; })() : addDays(weekStart(today), -7 * (n - 1));
  return series(orders, from, today, by).reverse();
}
export const sliceOrders = (orders, from, to) => orders.filter((o) => inDays(o.created_at, from, to));
export const sliceEvents = (events, from, to) => events.filter((e) => inDays(e.created_at, from, to));

export const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0);
/** % change vs the comparison number, as a label + direction. */
export function delta(cur, prev) {
  if (prev == null) return null;
  if (!prev) return cur ? { t: "new", d: 1 } : { t: "–", d: 0 };
  const c = Math.round(((cur - prev) / prev) * 1000) / 10;
  return { t: `${c > 0 ? "+" : ""}${c}%`, d: c > 0 ? 1 : c < 0 ? -1 : 0 };
}
export const fmtDur = (s) => (!s ? "–" : s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`);

/** Light list of every real order (any date) so repeat-order flags and customer totals are complete. */
export async function loadRepeatBase(sb) {
  const { rows } = await fetchAll(() => sb.from("orders").select("id,email,phone,created_at,status").neq("status", "pending_payment").order("created_at", { ascending: true }), 40);
  return rows;
}
