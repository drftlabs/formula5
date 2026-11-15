"use client";
import { useState, useEffect } from "react";
import { useShop } from "./ShopProvider";
import { inr, pctOff } from "@/lib/format";
import { Arrow } from "./Media";
import { Stars } from "./Star";

// Pack selector + add to bag / buy now. Pack 1 is the default.
export default function PdpBuy({ rest = [], p, packs, sold, tagline, top = [], rating }) {
  const { add, wish, toggleWish, setQc } = useShop();
  const [i, setI] = useState(0), [qty, setQty] = useState(1), [just, setJust] = useState(false), [atEnd, setAtEnd] = useState(false);
  // the sticky bar slides away once the footer is on screen, so no empty gap is needed under the footer
  useEffect(() => { const f = document.querySelector("footer"); if (!f || !("IntersectionObserver" in window)) return; const o = new IntersectionObserver(([e]) => setAtEnd(e.isIntersecting), { threshold: 0.15 }); o.observe(f); return () => o.disconnect(); }, []);
    const k = packs[i], off = pctOff(k.price, k.mrp), saved = wish.includes(p.id);
  const line = () => ({ ...p, price: k.price });
  const addBag = () => { add(line(), String(k.n), qty, false); setJust(true); setTimeout(() => setJust(false), 1800); };
  const buyNow = () => { add(line(), String(k.n), qty, true); setQc(true); };
  return (
    <div className="pd-buy">
      <div className="pd-price"><b>{inr(k.price)}</b>{k.mrp > k.price && <s>{inr(k.mrp)}</s>}{off > 0 && <em>{off}% off</em>}</div>
      {rating?.count > 0 && <a className="pd-rate" href="#reviews" aria-label={`Rated ${rating.avg} out of 5 from ${rating.count} reviews`}><Stars value={rating.avg} /><b>{rating.avg.toFixed(1)}</b><span>/ 5</span><small>({rating.count} {rating.count === 1 ? "review" : "reviews"})</small></a>}
      {tagline && <p className="pd-tagl">{tagline}</p>}
      <div className="pd-l">Choose your pack</div>
      <div className="pd-packs" role="radiogroup" aria-label="Pack size">
        {packs.map((x, n) => (
          <button key={x.n} role="radio" aria-checked={n === i} className={n === i ? "on" : ""} onClick={() => setI(n)}>
            <span>Pack {x.n}</span><b>{inr(x.price)}</b>{x.mrp > x.price && <small>{inr(x.mrp)}</small>}
          </button>
        ))}
      </div>
      {top.length > 0 && <div className="pd-ing"><div className="pd-l">Formula 5</div><p className="pd-ing-t">{top.filter(Boolean).slice(0, 5).map((t, n, arr) => <span key={n}><b>{t}</b>{n < arr.length - 1 && <i className="plus" aria-hidden="true">+</i>}</span>)}</p>{rest.length > 0 && <p className="pd-ing-r"><b>Also contains</b> {rest.join(" · ")}</p>}</div>}
      <div className="pd-act">
        <div className="pd-qty" aria-label="Quantity"><button aria-label="Fewer" onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span aria-live="polite">{qty}</span><button aria-label="More" onClick={() => setQty(Math.min(10, qty + 1))}>+</button></div>
        <button className="btn pd-add" disabled={sold} onClick={addBag}>{sold ? "Sold out" : just ? "Added ✓" : <>Add to bag <Arrow /></>}</button>
        <button className="pd-heart" aria-pressed={saved} aria-label={saved ? "Remove from wishlist" : "Save to wishlist"} onClick={() => toggleWish(p)}><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z" /></svg></button>
      </div>
      {!sold && <button className="pd-now" onClick={buyNow}>Buy it now</button>}
      {!sold && <div className={"pd-float" + ""} role="region" aria-label="Buy">
        <div className="pf-packs" role="radiogroup" aria-label="Choose pack">{packs.map((x, n) => <button key={x.n} role="radio" aria-checked={n === i} className={n === i ? "on" : ""} onClick={() => setI(n)}>Pack {x.n}</button>)}</div>
        <div className="pf-row"><div className="pf-price"><b>{inr(k.price * qty)}</b>{k.mrp > k.price && <s>{inr(k.mrp * qty)}</s>}</div><button className="pf-buy" onClick={buyNow}>Buy it now</button></div>
      </div>}
    </div>
  );
}
