"use client";
import { useRef, useState } from "react";
import { useShop } from "./ShopProvider";
import { inr } from "@/lib/format";
import { Arrow } from "./Media";

const Lock = () => <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16, stroke: "currentColor", fill: "none", strokeWidth: 2 }}><rect x="5" y="11" width="14" height="9" rx="1" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>;

export default function ProductBuy({ p, sizeKeys, colorOpts = [], cod = false }) {
  const { add, wish, toggleWish, say, setQc, setDrawer } = useShop();
  const [size, setSize] = useState(null), [err, setErr] = useState(false), [ci, setCi] = useState(0), [just, setJust] = useState(false);
  const color = colorOpts[ci] || null;
  const gridRef = useRef();
  const stock = size ? Number(p.sizes[size]) : 0;
  const totalLeft = sizeKeys.reduce((t, s) => t + Math.max(0, Number(p.sizes[s]) || 0), 0);
  const sold = totalLeft === 0;
  const lowAt = Number(p.low_stock ?? 3);
  const need = () => { setErr(true); gridRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); say("Select your UK size first"); };
  const flyEl = () => document.querySelector(".gal-main img") || gridRef.current;
  const addBag = () => { if (!size) return need(); add(p, size, 1, false, color, flyEl()); setJust(true); setTimeout(() => setJust(false), 1800); };
  const buyNow = () => { if (!size) return need(); add(p, size, 1, true, color); setQc(true); };   // opens checkout as a popup
  const saved = wish.includes(p.id);
  return (
    <>
      {colorOpts.length > 0 && <><div className="opt-label"><span>Colour</span></div>
        <div className="pdp-sw" role="radiogroup" aria-label="Colour">{colorOpts.map((o, k) => <button key={o.slug} role="radio" aria-checked={k === ci} className={k === ci ? "on" : ""} onClick={() => setCi(k)}><i style={{ background: o.hex }} />{o.name}</button>)}</div></>}
      <div className="opt-label"><span>UK size</span><span className="ol-r">{size ? <b>UK {size}</b> : <em>Select one</em>}</span></div>
      <div className={"size-grid" + (err && !size ? " err" : "")} ref={gridRef} role="radiogroup" aria-label="UK size">
        {sizeKeys.map((s) => <button key={s} role="radio" aria-checked={size === s} className={size === s ? "on" : ""} disabled={Number(p.sizes[s]) <= 0} onClick={() => { setSize(s); setErr(false); }} aria-label={`UK ${s}${Number(p.sizes[s]) <= 0 ? ", sold out" : ""}`}>{s}</button>)}
      </div>
      {size && stock > 0 && stock <= lowAt ? <p className="low">⚡ Only {stock} left in UK {size}</p> : !sold && totalLeft <= lowAt * 2 ? <p className="low">⚡ Selling fast: {totalLeft} pairs left in total</p> : null}
      <div className="pdp-actions">
        <button className={"btn addbtn" + (just ? " done" : "")} disabled={sold} onClick={addBag}>{sold ? "Sold out" : just ? "Added ✓" : "Add to bag"}{!sold && !just && <Arrow />}</button>
        <button className="heartbtn" aria-pressed={saved} aria-label={saved ? "Remove from wishlist" : "Save to wishlist"} onClick={() => toggleWish(p)}><svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-9-9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c-2 4.6-9 9-9 9z" /></svg></button>
      </div>
      {!sold && <button className="btn ghost buynow" onClick={buyNow}><Lock /> Buy it now <Arrow /></button>}

      {/* floating checkout: appears the moment a size is picked */}
      {!sold && (
        <div className={"float-co" + (size ? " show" : "")} aria-hidden={!size}>
          <div className="fc-info">{p.images?.[0] && <img src={p.images[0]} alt="" />}<div><b>{p.name}</b><small>UK {size}{color ? ` · ${color.name}` : ""} · {inr(p.price)}</small></div></div>
          <button className="fc-bag" tabIndex={size ? 0 : -1} aria-label="Add to bag" onClick={() => { addBag(); }} title="Add to bag"><svg viewBox="0 0 24 24"><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg></button>
          <button className="btn fc-go" tabIndex={size ? 0 : -1} onClick={buyNow}><Lock /> Checkout <Arrow /></button>
        </div>
      )}
      {!size && <div className="stickybar"><span className="p">{inr(p.price)}</span><button className="btn" disabled={sold} onClick={need}>{sold ? "Sold out" : "Select size"}</button></div>}
    </>
  );
}
