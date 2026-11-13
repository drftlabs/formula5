"use client";
import { ping } from "@/lib/analytics";
import { track } from "@/lib/track";
import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";

const Ctx = createContext(null);
export const useShop = () => useContext(Ctx);
const same = (i, id, size, color = "") => i.id === id && i.size === String(size) && (i.color || "") === (color || "");
export const lineKey = (i) => `${i.id}|${i.size}|${i.color || ""}`;

// A small copy of the product flies from where you tapped into the bag icon.
function fly(from, img) {
  try {
    const bag = document.querySelector("[data-bag]"); if (!bag || !from) return;
    const a = from.getBoundingClientRect(), b = bag.getBoundingClientRect();
    const el = document.createElement(img ? "img" : "div"); if (img) el.src = img;
    el.style.cssText = `position:fixed;left:${a.left + a.width / 2 - 36}px;top:${a.top + a.height / 2 - 36}px;width:72px;height:72px;object-fit:contain;z-index:600;pointer-events:none;${img ? "filter:drop-shadow(0 8px 10px rgba(0,0,0,.25))" : "background:#0A0A0A"}`;
    document.body.appendChild(el);
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const an = el.animate([{ transform: "translate(0,0) scale(1) rotate(0)", opacity: 1 }, { transform: `translate(${dx * 0.45}px,${dy * 0.45 - 70}px) scale(.85) rotate(-8deg)`, opacity: 1, offset: 0.45 }, { transform: `translate(${dx}px,${dy}px) scale(.15) rotate(12deg)`, opacity: 0.3 }], { duration: 800, easing: "cubic-bezier(.45,.05,.7,.4)" });
    an.onfinish = () => el.remove(); setTimeout(() => el.remove(), 1200);
  } catch {}
}

// Bag (saved in this browser), wishlist (browser, synced to the account when logged in), toast.
export default function ShopProvider({ children, shipping }) {
  const [items, setItems] = useState([]);
  const [wish, setWish] = useState([]);
  const [ready, setReady] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [qc, setQc] = useState(false); // quick-checkout popup
  const [pulse, setPulse] = useState(0);
  const [email, setEmail] = useState(null);
  const [toast, setToast] = useState(null);
  const tm = useRef();

  useEffect(() => {
    let w = [];
    try { setItems(JSON.parse(localStorage.getItem("tk_cart") || "[]")); w = JSON.parse(localStorage.getItem("tk_wish") || "[]"); setWish(w); } catch {}
    setReady(true);
    fetch("/api/wishlist").then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (!d) return;
      setEmail(d.email);
      const merged = [...new Set([...d.ids, ...w])];
      setWish(merged);
      const extra = w.filter((x) => !d.ids.includes(x));
      if (extra.length) fetch("/api/wishlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: extra, on: true }) });
    }).catch(() => {});
  }, []);
  useEffect(() => { if (ready) try { localStorage.setItem("tk_cart", JSON.stringify(items)); } catch {} }, [items, ready]);
  useEffect(() => { if (ready) try { localStorage.setItem("tk_wish", JSON.stringify(wish)); } catch {} }, [wish, ready]);

  useEffect(() => { if (drawer) setToast(null); }, [drawer]); // the bag already shows what was added
  const say = useCallback((text, bag) => {
    setToast({ text, bag }); clearTimeout(tm.current); tm.current = setTimeout(() => setToast(null), bag ? 3400 : 2400);
  }, []);

  // add(product, size, qty, silent, colour {slug,name}, element-to-fly-from)
  const add = (p, size, qty = 1, silent = false, color = null, from = null) => {
    const cs = color?.slug || "";
    ping({ t: "cart", path: typeof location !== "undefined" ? location.pathname : "/" });
    track("AddToCart", { content_ids: [p.id], content_name: p.name, content_type: "product", value: p.price * qty, currency: "INR" });
    setItems((cur) => {
      const f = cur.find((i) => same(i, p.id, size, cs));
      if (f) return cur.map((i) => (i === f ? { ...i, qty: Math.min(10, i.qty + qty) } : i));
      return [...cur, { id: p.id, slug: p.slug, name: p.name, price: p.price, image: p.images?.[0] || "", size: String(size), qty, color: cs, colorName: color?.name || "" }];
    });
    if (!silent) { say(`${p.name} · ${/^\d+$/.test(String(size)) ? "Pack " + size : size}${color?.name ? " · " + color.name : ""} added`, true); setPulse((n) => n + 1); fly(from, p.images?.[0]); }
  };
  const setQty = (id, size, qty, color = "") => setItems((cur) => cur.map((i) => (same(i, id, size, color) ? { ...i, qty } : i)).filter((i) => i.qty > 0));
  const remove = (id, size, color = "") => setItems((cur) => cur.filter((i) => !same(i, id, size, color)));
  const clear = () => setItems([]);
  const toggleWish = (p) => {
    const on = !wish.includes(p.id);
    setWish((w) => (on ? [...w, p.id] : w.filter((x) => x !== p.id)));
    say(on ? `${p.name} saved to wishlist` : `${p.name} removed from wishlist`);
    fetch("/api/wishlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [p.id], on }) }).catch(() => {});
  };

  const count = items.reduce((t, i) => t + i.qty, 0);
  const subtotal = items.reduce((t, i) => t + i.qty * i.price, 0);
  const ship = subtotal === 0 ? 0 : subtotal >= shipping.min ? 0 : shipping.fee;

  return (
    <Ctx.Provider value={{ items, count, subtotal, ship, total: subtotal + ship, shipping, add, setQty, remove, clear, wish, toggleWish, drawer, setDrawer, qc, setQc, pulse, email, say, ready }}>
      {children}
      <div className={"toast" + (toast ? " show" : "")} role="status" aria-live="polite">
        <i /><span>{toast?.text}</span>
        {toast?.bag && <button onClick={() => { setToast(null); setDrawer(true); }}>View bag</button>}
      </div>
    </Ctx.Provider>
  );
}
