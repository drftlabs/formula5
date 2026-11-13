import { inr, STATUS } from "./format";

export const VALID = (o) => !["pending_payment", "cancelled", "refunded"].includes(o.status);
export const isCod = (o) => o.payment_method === "cod";

// What the admin sees in the "Status" column = fulfilment stage (payment is shown separately).
export const STAGE = { pending_payment: "Awaiting payment", paid: "Unfulfilled", processing: "Packing", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled", refunded: "Refunded" };
export const STAGE_TONE = { pending_payment: "warn", paid: "new", processing: "info", shipped: "info", delivered: "ok", cancelled: "bad", refunded: "bad" };
export const stageLabel = (o) => STAGE[o.status] || STATUS[o.status] || o.status;

/** Amount the customer has actually paid online (full for prepaid, the advance for COD). */
export function paidOnline(o) {
  if (o.status === "pending_payment") return 0;
  if (!isCod(o)) return Number(o.total || 0);
  if (o.amount_paid != null) return Number(o.amount_paid || 0);
  return Math.max(0, Number(o.total || 0) - Number(o.amount_due || 0));
}
/** Payment badge: never says "Paid" for an order whose cash has not been collected. */
export function payInfo(o) {
  const due = Number(o.amount_due || 0);
  if (o.status === "pending_payment") return { kind: "pending", label: "Not paid", sub: "payment not completed", tone: "warn" };
  if (o.status === "refunded") return { kind: isCod(o) ? "cod" : "prepaid", label: "Refunded", sub: "", tone: "bad" };
  if (!isCod(o)) return o.status === "cancelled" ? { kind: "prepaid", label: "Prepaid", sub: `${inr(o.total)} cancelled · refund in Razorpay`, tone: "mut" } : { kind: "prepaid", label: "Prepaid", sub: `${inr(o.total)} paid online`, tone: "ok" };
  const adv = paidOnline(o);
  if (due > 0) {
    if (o.status === "cancelled") return { kind: "cod", label: "COD", sub: "cancelled · nothing to collect", tone: "mut" };
    return { kind: "cod", label: adv > 0 ? "COD · part-paid" : "COD", sub: `${inr(due)} to collect${o.status === "delivered" ? " (delivered, not marked collected)" : ""}`, tone: o.status === "delivered" ? "bad" : "cod" };
  }
  return { kind: "cod", label: "COD · collected", sub: adv > 0 ? `${inr(o.total)} received` : "", tone: "ok" };
}

/** Phone number as digits with the India country code, for tel: and wa.me links. */
export function phoneIntl(p) {
  let d = String(p || "").replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  if (d.length === 10) d = "91" + d;
  return d;
}
export const phoneKey = (p) => String(p || "").replace(/\D/g, "").slice(-10);
export const emailKey = (e) => String(e || "").trim().toLowerCase();

/**
 * Flags repeat orders. Input: every real (non-pending) order, any order. For each order id returns
 * { n: "this is the customer's n-th live order", prev: how many earlier live orders, gapH: hours since the previous one }.
 * Same email OR same 10-digit phone = same person. Cancelled orders do not count as "earlier orders".
 */
export function repeatMap(orders) {
  const list = orders.filter((o) => o.status !== "pending_payment").slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const byE = new Map(), byP = new Map(), out = new Map();
  for (const o of list) {
    const e = emailKey(o.email), p = phoneKey(o.phone);
    const prior = new Map();
    for (const x of [...(byE.get(e) || []), ...(p.length === 10 ? byP.get(p) || [] : [])]) prior.set(x.id, x);
    const last = [...prior.values()].reduce((m, x) => Math.max(m, new Date(x.created_at).getTime()), 0);
    out.set(o.id, { n: prior.size + 1, prev: prior.size, gapH: prior.size ? (new Date(o.created_at).getTime() - last) / 36e5 : null });
    if (o.status !== "cancelled") {
      if (e) byE.set(e, [...(byE.get(e) || []), o]);
      if (p.length === 10) byP.set(p, [...(byP.get(p) || []), o]);
    }
  }
  return out;
}
