import { getProducts, getCategories, getConcerns, getSettings, packsOf } from "./data";
import { shippingCfg } from "./pricing";

const clip = (t, n) => { const s = String(t || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1) + "…" : s; };
let cache = { at: 0, text: "", slugs: [] };

// Everything Rohan knows: the live catalogue (from your database) + shipping/payment rules. Rebuilt every 5 minutes.
export async function knowledge() {
  if (Date.now() - cache.at < 5 * 60 * 1000 && cache.text) return cache;
  const [products, cats, cons, s] = await Promise.all([getProducts(), getCategories(), getConcerns(), getSettings()]);
  const cfg = shippingCfg(s), cn = Object.fromEntries(cons.map((c) => [c.slug, c.name])), cc = Object.fromEntries(cats.map((c) => [c.slug, c.name]));
  const lines = products.map((p) => {
    const pk = packsOf(p);
    return [
      `- ${p.name} [slug: ${p.slug}] | ${cc[p.category] || p.category}`,
      `  Prices: ${pk.map((k) => `Pack ${k.n} Rs ${k.price}${k.mrp ? ` (MRP ${k.mrp})` : ""}`).join(", ")}`,
      `  Good for: ${(p.concerns || []).map((c) => cn[c] || c).join(", ") || "-"}`,
      `  Main ingredients: ${(p.top_ingredients || []).join(", ")}`,
      `  What it is: ${clip(p.description || p.usp, 260)}`,
      `  How to use: ${clip(p.how_to_use, 260)}`,
    ].join("\n");
  });
  const text = `PRODUCTS (only recommend from this list):\n${lines.join("\n")}\n\nCATEGORIES: ${cats.map((c) => c.name).join(", ")}\nCONCERNS: ${cons.map((c) => c.name).join(", ")}\n\nSHIPPING & PAYMENT:\n- Free shipping on orders above Rs ${cfg.min}; otherwise shipping fee Rs ${cfg.fee}.\n- Dispatch: ${s.dispatch_days || "1-2 business days"}. Delivery: ${s.delivery_days || "3-5 business days"} across India.\n- Cash on delivery: ${cfg.codEnabled ? `available, extra COD fee Rs ${cfg.codFee}${cfg.codFlat > 0 ? `, Rs ${cfg.codFlat} must be paid online in advance` : cfg.codPct > 0 ? `, ${cfg.codPct}% of the product amount must be paid online in advance` : ", confirmed with a WhatsApp code"}` : "not available"}. Online payment (UPI, cards, netbanking) is also available.\n- Pack 1, Pack 2 and Pack 3 are the quantity options on each product page; bigger packs cost less per unit.\n- Refund & Cancellation policy is at /policies/refund. Shipping policy /policies/shipping. Contact page /contact. Track order page /track.`;
  cache = { at: Date.now(), text, slugs: products.map((p) => p.slug) };
  return cache;
}
