"use client";
import Link from "next/link";
import { useState } from "react";
import { useShop } from "./ShopProvider";
import Bottle from "./Bottle";
import { inr, splitName, activeLabel, pctOff } from "@/lib/format";

export const totalStock = (p) => Object.values(p.sizes || {}).reduce((t, n) => t + (Number(n) || 0), 0);
const heartPath = <path d="M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z" />;

// accent comes from the product (admin colour) or its category; the tint panel is derived from it
export default function ProductCard({ p, category, accent, tagMap = {} }) {
  const { add, wish, toggleWish } = useShop();
  const [added, setAdded] = useState(false), [bad, setBad] = useState(false);
  const { short, amount, inci } = splitName(p.name);
  const pack = (Array.isArray(p.packs) && p.packs[0]) || { n: 1, price: p.price, mrp: p.compare_price };
  const off = pctOff(pack.price, pack.mrp);
  const sold = totalStock(p) === 0;
  const tag = (p.tags || []).map((s) => tagMap[s]).filter(Boolean)[0];
  const saved = wish.includes(p.id);
  const acc = p.accent || accent || "#B7B7AE";
  const quick = () => {
    add({ ...p, price: pack.price }, "Pack " + pack.n, 1, false, null, null);
    setAdded(true); setTimeout(() => setAdded(false), 1600);
  };
  return (
    <article className="f5-card" style={{ "--acc": acc }}>
      <Link className={"f5-pm" + (p.images?.[0] && !bad ? " has-img" : "")} href={`/products/${p.slug}`} aria-label={`${short}, ${inr(pack.price)}`}>
        {p.images?.[0] && !bad ? <img className="f5-pm-img" src={p.images[0]} alt={short} loading="lazy" decoding="async" onError={() => setBad(true)} /> : <div className="f5-pm-art"><Bottle product={p} /></div>}
        {tag && <span className="f5-tag">{tag.name}</span>}
        {amount && <span className="f5-chip"><b>{amount}</b> {activeLabel(inci)}</span>}
      </Link>
      <button className="f5-heart" aria-pressed={saved} aria-label={`${saved ? "Remove" : "Save"} ${short} ${saved ? "from" : "to"} wishlist`} onClick={() => toggleWish(p)}><svg viewBox="0 0 24 24" aria-hidden="true">{heartPath}</svg></button>
      <div className="f5-info">
        {category && <div className="f5-cat-l">{category}</div>}
        <h3 className="f5-name"><Link href={`/products/${p.slug}`}>{short}</Link></h3>
        <div className="f5-price"><b>{inr(pack.price)}</b>{pack.mrp > pack.price && <s>{inr(pack.mrp)}</s>}{off > 0 && <em>{off}% off</em>}</div>
        <button className={"f5-add" + (added ? " ok" : "")} disabled={sold} aria-label={sold ? `${short} is sold out` : `Add ${short} to bag`} onClick={quick}>
          {sold ? "Sold out" : added ? <><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>Added</> : "Add to bag"}
        </button>
      </div>
    </article>
  );
}
