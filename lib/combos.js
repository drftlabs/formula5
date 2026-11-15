// Combo ("Goes well with") engine. Pure functions, used by the product page and, to re-check discounts, by checkout.
// Edit COMBO_PCT to change the saving. Combo prices always end in 5 and are rounded DOWN, so the saving is never less than the stated %.
export const COMBO_PCT = { 2: 20, 3: 25 };
export const MAX_THREE_TOTAL = 1800; // above this, offer a 2-product combo instead of 3

const P1 = (p) => Number((Array.isArray(p.packs) && p.packs[0]?.price) || p.price) || 0;
const inStock = (p) => p.active !== false && (p.sizes ? Number(p.sizes["1"]) > 0 : true);

// Which categories go together (best partner first)
const PARTNERS = {
  skincare: ["skincare", "lip-care", "body-care"], "hair-care": ["hair-care", "hair-body-care"], "hair-body-care": ["hair-care", "body-care", "skincare"],
  supplements: ["supplements"], "oral-care": ["lip-care", "body-care", "skincare"], "lip-care": ["skincare", "oral-care", "body-care"],
  "body-care": ["skincare", "hair-body-care", "intimate-care"], "intimate-care": ["body-care", "skincare"],
};
// Routine step, from the product name: a good routine mixes steps (cleanse, then treat, then care)
const ROLES = [["cleanse", /face wash|cleanser|shampoo|shower gel|scrub|tooth powder|intimate wash|face mask/i], ["treat", /serum|night cream|eye |elixir|roll-on|oil/i], ["care", /lotion|cream|lip |barrier|recovery|underarm/i], ["ingest", /capsule/i]];
const role = (p) => (ROLES.find(([, re]) => re.test(p.name || "")) || ["other"])[0];

function score(a, b) {
  if (a.slug === b.slug) return -99;
  let s = 0;
  const pr = PARTNERS[a.category] || [a.category], i = pr.indexOf(b.category);
  s += i < 0 ? -6 : 5 - i * 1.5;
  s += Math.min(2, (a.concerns || []).filter((c) => (b.concerns || []).includes(c)).length) * 3;
  if (a.category === "supplements") s += role(a) === role(b) ? -1 : 0; else s += role(a) !== role(b) ? 3 : -4;
  s -= Math.abs(P1(a) - P1(b)) / 400;
  return s;
}

export function comboPrice(total, n) {
  const pct = COMBO_PCT[n] || 20, raw = total * (1 - pct / 100);
  const price = Math.floor((raw - 5) / 10) * 10 + 5;
  return { price, pct, total, save: total - price, savePct: Math.round(((total - price) / total) * 100) };
}

// Best combo for one product: it plus 1 or 2 partners. Returns { members:[products], ...comboPrice } or null.
export function pickCombo(main, all) {
  const pool = (all || []).filter((p) => p.slug !== main.slug && inStock(p) && P1(p) > 0);
  const best = (fn) => pool.map((p) => [fn(p), p]).sort((x, y) => y[0] - x[0] || x[1].slug.localeCompare(y[1].slug));
  const b = best((p) => score(main, p))[0];
  if (!b || b[0] < 0) return null;
  const second = best((p) => (p.slug === b[1].slug ? -99 : score(main, p) + score(b[1], p) * 0.6 + (role(p) !== role(main) && role(p) !== role(b[1]) ? 2 : 0)))[0];
  const three = second && second[0] > 0 ? [main, b[1], second[1]] : null;
  const total3 = three ? three.reduce((t, p) => t + P1(p), 0) : 0;
  const members = three && total3 <= MAX_THREE_TOTAL ? three : [main, b[1]];
  const total = members.reduce((t, p) => t + P1(p), 0);
  return { members, ...comboPrice(total, members.length), key: members.map((p) => p.slug).join("|") };
}
export const validCombo = (key, all) => {
  const slugs = String(key || "").split("|"), main = (all || []).find((p) => p.slug === slugs[0]);
  const c = main && pickCombo(main, all);
  return !!c && c.key.split("|").sort().join("|") === [...slugs].sort().join("|");
};

// Money taken off the cart for complete combos. `ok(key)` lets the server confirm the combo is a real recommendation.
export function comboSavings(items, ok = () => true) {
  const groups = {};
  for (const i of items || []) if (i.combo && String(i.size) === "1") (groups[i.combo] ||= []).push(i);
  let off = 0;
  for (const [key, ls] of Object.entries(groups)) {
    const slugs = key.split("|");
    if (slugs.length < 2 || !ok(key)) continue;
    const per = slugs.map((s) => { const l = ls.filter((x) => x.slug === s); return { qty: l.reduce((t, x) => t + x.qty, 0), price: Number(l[0]?.price) || 0 }; });
    const sets = Math.min(...per.map((p) => p.qty));
    if (!sets || per.some((p) => !p.price)) continue;
    const total = per.reduce((t, p) => t + p.price, 0);
    off += (total - comboPrice(total, slugs.length).price) * sets;
  }
  return off;
}
