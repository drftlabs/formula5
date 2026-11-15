"use client";
import { useShop } from "./ShopProvider";
import { inr } from "@/lib/format";
import { opt } from "@/lib/img";

// "Goes well with": the product on this page + 1 or 2 partners, one row, one combo price.
export default function ComboBar({ combo }) {
  const { add, setDrawer } = useShop();
  const { members, price, total, pct, key } = combo;
  const go = () => { members.forEach((m) => add(m, "1", 1, true, null, null, key)); setDrawer(true); };
  return (
    <div className="cb-wrap">
      <div className="cb-row">
        {members.map((m, n) => (
          <div className="cb-item-w" key={m.slug}>
            {n > 0 && <i className="cb-plus">+</i>}
            <a className="cb-item" href={"/products/" + m.slug}>
              <span className="cb-img">{m.img && <img src={opt(m.img, 240)} alt={m.short} loading="lazy" decoding="async" />}</span>
              <b>{m.short}</b><em>{inr(m.p1)}</em>
            </a>
          </div>
        ))}
      </div>
      <p className="cb-pr"><span>Get this combo for</span><strong>{inr(price)}</strong><s>{inr(total)}</s><u>{pct}% less</u></p>
      <button className="btn cb-btn" onClick={go}>Add combo to bag</button>
    </div>
  );
}
