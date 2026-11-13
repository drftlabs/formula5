"use client";
import { opt } from "@/lib/img";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useShop } from "./ShopProvider";
import { inr } from "@/lib/format";
import { Arrow } from "./Media";

export default function CartDrawer() {
  const { items, count, subtotal, shipping, setQty, remove, drawer, setDrawer } = useShop();
  const closeRef = useRef();
  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
    if (drawer) closeRef.current?.focus();
    const esc = (e) => e.key === "Escape" && setDrawer(false);
    addEventListener("keydown", esc); return () => removeEventListener("keydown", esc);
  }, [drawer, setDrawer]);
  const toFree = Math.max(0, shipping.min - subtotal);
  return (
    <div className={"drawer" + (drawer ? " open" : "")} inert={drawer ? undefined : ""}>
      <div className="scrim" onClick={() => setDrawer(false)} />
      <aside className="panel" role="dialog" aria-modal="true" aria-labelledby="drawerT">
        <div className="d-head"><h2 id="drawerT">Your bag <span>({count})</span></h2><button ref={closeRef} className="ib" aria-label="Close bag" onClick={() => setDrawer(false)}><svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5 5 19" /></svg></button></div>
        <div className="d-body">
          {!count ? (
            <div className="ebag"><b>Your bag is empty</b><p>Add a formula to get started.</p><Link className="btn" href="/collections/all" onClick={() => setDrawer(false)}>Shop Formula 5 <Arrow /></Link></div>
          ) : (
            <>
              <p style={{ fontSize: 12, color: "var(--concrete)", padding: "14px 0 4px", letterSpacing: ".06em" }}>{toFree > 0 ? <>Add <b style={{ color: "var(--chalk)" }}>{inr(toFree)}</b> more for free shipping</> : <b style={{ color: "var(--chalk)" }}>You've unlocked free shipping</b>}</p>
              {items.map((i) => (
                <div className="li" key={i.id + i.size + (i.color || "")}>
                  <div className="thumb">{i.image && <img src={opt(i.image, 128)} alt={i.name} loading="lazy" decoding="async" />}</div>
                  <div><h3><Link href={`/products/${i.slug}`} onClick={() => setDrawer(false)}>{i.name}</Link></h3><small>{/^\d+$/.test(i.size) ? `Pack ${i.size}` : i.size}{i.colorName ? ` · ${i.colorName}` : ""}</small>
                    <div className="qty"><button aria-label="Decrease quantity" onClick={() => setQty(i.id, i.size, i.qty - 1, i.color)}>−</button><span aria-live="polite">{i.qty}</span><button aria-label="Increase quantity" onClick={() => setQty(i.id, i.size, Math.min(10, i.qty + 1), i.color)}>+</button></div></div>
                  <div><div className="pr">{inr(i.price * i.qty)}</div><button className="rm" onClick={() => remove(i.id, i.size, i.color)} aria-label={`Remove ${i.name}`}>Remove</button></div>
                </div>
              ))}
            </>
          )}
        </div>
        {count > 0 && <div className="d-foot"><div className="sub"><span>Subtotal</span><span>{inr(subtotal)}</span></div><small>Shipping and taxes are shown at checkout. Secure payments.</small><Link className="btn" href="/checkout" onClick={() => setDrawer(false)}>Checkout <Arrow /></Link></div>}
      </aside>
    </div>
  );
}
