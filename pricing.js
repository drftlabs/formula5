// ONE place that decides what a customer pays. Used by the browser (to show totals) and by the server (to charge).
// `cfg` = { min, fee, codEnabled, codFee, codPct }.  `discount` = { type: 'percent'|'flat', value, min_order } or null.
export function priceOrder({ subtotal, method = "online", cfg, discount = null }) {
  let disc = 0;
  if (discount && subtotal >= (Number(discount.min_order) || 0)) {
    disc = discount.type === "percent" ? Math.floor((subtotal * Number(discount.value)) / 100) : Math.min(Number(discount.value) || 0, subtotal);
  }
  const after = subtotal - disc;
  if (method === "cod") {
    const shipping = Number(cfg.codFee) || 0, total = after + shipping, pct = Math.min(100, Math.max(0, Number(cfg.codPct) || 0));
    const payNow = pct > 0 ? Math.max(1, Math.ceil((total * pct) / 100)) : 0;
    return { method, subtotal, discount: disc, shipping, total, payNow, due: total - payNow };
  }
  const shipping = after >= Number(cfg.min) ? 0 : Number(cfg.fee) || 0, total = after + shipping;
  return { method: "online", subtotal, discount: disc, shipping, total, payNow: total, due: 0 };
}

const nums = (t) => (String(t || "").match(/\d+/g) || []).map(Number);
export const shippingCfg = (s) => ({
  returnDays: Number(s.return_days) || 7, exchangeDays: Number(s.exchange_days) || 7,
  etaMin: nums(s.delivery_days)[0] || 3, etaMax: nums(s.delivery_days)[1] || nums(s.delivery_days)[0] || 4,
  min: Number(s.free_shipping_min), fee: Number(s.shipping_fee),
  codEnabled: s.cod_enabled !== false && s.cod_enabled !== "false", codFee: s.cod_fee == null || s.cod_fee === "" ? 99 : Number(s.cod_fee), codPct: s.cod_prepaid_pct == null || s.cod_prepaid_pct === "" ? 10 : Number(s.cod_prepaid_pct),
});

// Validate a discount row against the subtotal. Returns { ok, rule?, error? }.
export function checkDiscount(d, subtotal) {
  if (!d || !d.active) return { ok: false, error: "That code isn't valid." };
  if (d.expires_at && new Date(d.expires_at) < new Date()) return { ok: false, error: "That code has expired." };
  if (d.max_uses != null && d.used >= d.max_uses) return { ok: false, error: "That code has been fully used." };
  if (subtotal < (d.min_order || 0)) return { ok: false, error: `Add items worth ₹${Number(d.min_order).toLocaleString("en-IN")} to use this code.` };
  return { ok: true, rule: { code: d.code, type: d.type, value: d.value, min_order: d.min_order } };
}
