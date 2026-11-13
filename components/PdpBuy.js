"use client";
import { useState, useRef, useEffect } from "react";
import { useShop } from "./ShopProvider";
import { inr, pctOff } from "@/lib/format";
import { Arrow } from "./Media";

// Pack selector + add to bag / buy now. Pack 1 is the default.
export default function PdpBuy({ p, packs, sold, tagline, top = [] }) {
  const { add, wish, toggleWish, setQc } = useShop();
  const [i, setI] = useState(0), [qty, setQty] = useState(1), [just, setJust] = useState(false);
  const actRef = useRef(), [float, setFloat] = useState(false);
  useEffect(() => { const el = actRef.current; if (!el) return; const io = new IntersectionObserver(([e]) => setFloat(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 }); io.observe(el); return () => io.disconnect(); }, []);
  const k = packs[i], off = pctOff(k.price, k.mrp), saved = wish.includes(p.id);
  const line = () => ({ ...p, price: k.price });
  const addBag = () => { add(line(), String(k.n), qty, false); setJust(true); setTimeout(() => setJust(false), 1800); };
  const buyNow = () => { add(line(), String(k.n), qty, true); setQc(true); };
  return (
    <div className="pd-buy">
      <div className="pd-price"><b>{inr(k.price)}</b>{k.mrp > k.price && <s>{inr(k.mrp)}</s>}{off > 0 && <em>{off}% off</em>}</div>
      {tagline && <p className="pd-tagl">{tagline}</p>}
      <div className="pd-l">Choose your pack</div>
      <div className="pd-packs" role="radiogroup" aria-label="Pack size">
        {packs.map((x, n) => (
          <button key={x.n} role="radio" aria-checked={n === i} className={n === i ? "on" : ""} onClick={() => setI(n)}>
            <span>Pack {x.n}</span><b>{inr(x.price)}</b>{x.mrp > x.price && <small>{inr(x.mrp)}</small>}
          </button>
        ))}
      </div>
      {top.length > 0 && <div className="pd-ing"><div className="pd-l">Top ingredients</div><ul>{top.map((t, n) => <li key={n}>{t}</li>)}</ul></div>}
      <div className="pd-act" ref={actRef}>
        <div className="pd-qty" aria-label="Quantity"><button aria-label="Fewer" onClick={() => setQty(Math.max(1, qty - 1))}>−</button><span aria-live="polite">{qty}</span><button aria-label="More" onClick={() => setQty(Math.min(10, qty + 1))}>+</button></div>
        <button className="btn pd-add" disabled={sold} onClick={addBag}>{sold ? "Sold out" : just ? "Added ✓" : <>Add to bag <Arrow /></>}</button>
        <button className="pd-heart" aria-pressed={saved} aria-label={saved ? "Remove from wishlist" : "Save to wishlist"} onClick={() => toggleWish(p)}><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z" /></svg></button>
      </div>
      {!sold && <button className="pd-now" onClick={buyNow}>Buy it now</button>}
      {!sold && <div className={"pd-float" + (float ? " show" : "")} aria-hidden={!float}><div><small>Pack {k.n}</small><b>{inr(k.price * qty)}</b></div><button tabIndex={float ? 0 : -1} onClick={buyNow}>Buy it now</button></div>}
    </div>
  );
}
