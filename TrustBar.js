// Reassurance strip above the footer on every page.
const I = {
  lock: <><rect x="5" y="11" width="14" height="9" rx="1" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>,
  swap: <path d="M4 12a8 8 0 0 1 14-5l2 2M20 12a8 8 0 0 1-14 5l-2-2M20 4v5h-5M4 20v-5h5" />,
  cash: <><rect x="3" y="6" width="18" height="12" rx="1" /><circle cx="12" cy="12" r="2.5" /></>,
  help: <><path d="M4 13v-1a8 8 0 0 1 16 0v1" /><rect x="3" y="13" width="4" height="6" rx="1" /><rect x="17" y="13" width="4" height="6" rx="1" /></>,
};
export default function TrustBar({ s }) {
  const pct = Number(s.cod_prepaid_pct) || 0;
  const items = [
    ["swap", Number(s.free_shipping_min) > 0 ? `Free shipping above ₹${Number(s.free_shipping_min).toLocaleString("en-IN")}` : "Fast delivery", s.delivery_days || "3–5 business days"],
    ...(s.cod_enabled !== false ? [["cash", "Cash on delivery", pct > 0 ? `Pay ${pct}% now, the rest on delivery` : "Pay when it arrives"]] : []),
  ];
  return (
    <section className="f5-trust" aria-label="Why shop with Formula 5">
      {items.map(([k, t, d]) => <div key={t}><svg viewBox="0 0 24 24" aria-hidden="true">{I[k]}</svg><b>{t}</b><small>{d}</small></div>)}
    </section>
  );
}
