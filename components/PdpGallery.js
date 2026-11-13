"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import Art from "./Art";
import Bottle from "./Bottle";

// Product image slider. Auto-advances until someone touches it. Pinch-to-zoom works on the image only (page zoom is off).
// A zoom button opens a full-screen viewer. Built for JPEGs that carry their own background; placeholders stand in until photos exist.
const Slide = ({ s, product, sub, k, big }) => s.src
  ? <img onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} src={s.src} alt={`${product.name}, view ${k + 1}`} loading={k && !big ? "lazy" : "eager"} decoding="async" draggable="false" />
  : s.art === "arch" ? <Art items={[product]} />
  : s.art === "pack" ? <div className="pg-ph pg-ph2"><Bottle product={product} scale={1.25} /></div>
  : <div className="pg-ph pg-ph3"><b>{sub}</b><span>Hero active</span></div>;

export default function PdpGallery({ images = [], product }) {
  const ref = useRef(), z = useRef({ s: 1, x: 0, y: 0, d0: 0, s0: 1, px: 0, py: 0 }), last = useRef(0);
  const touch = () => { last.current = Date.now(); };
  const [i, setI] = useState(0), [zoomed, setZoomed] = useState(false), [box, setBox] = useState(false), [hover, setHover] = useState(false);
  const slides = images.length ? images.map((src) => ({ src })) : [{ art: "arch" }, { art: "pack" }, { art: "pct" }];
  const n = slides.length;
  const sub = product.name.match(/(\d+(?:\.\d+)?\s?(?:%|mg))/i)?.[1] || "";
  const upd = useCallback(() => { const el = ref.current; if (el) setI(Math.round(el.scrollLeft / el.clientWidth)); }, []);
  const go = (k) => { const el = ref.current; if (el) el.scrollTo({ left: ((k % n) + n) % n * el.clientWidth, behavior: "smooth" }); };

  // auto-slide: every 4s, loops. A touch, swipe, zoom or click pauses it; it picks up again by itself a few seconds after the visitor stops.
  useEffect(() => {
    if (n < 2 || hover || box || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => { if (!document.hidden && z.current.s <= 1 && Date.now() - last.current > 3500) go(i + 1); }, 4000);
    return () => clearInterval(t);
  }, [i, n, hover, box]); // eslint-disable-line

  // pinch to zoom, on the image only
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const node = () => el.children[Math.round(el.scrollLeft / el.clientWidth)]?.firstElementChild;
    const apply = (anim) => { const m = node(); if (!m) return; const { s, x, y } = z.current; m.style.transition = anim ? "transform .25s ease" : "none"; m.style.transform = `translate(${x}px,${y}px) scale(${s})`; m.style.transformOrigin = "50% 50%"; };
    const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const start = (e) => {
      touch();
      if (e.touches.length === 2) { z.current.d0 = dist(e.touches); z.current.s0 = z.current.s; setZoomed(true); }
      else if (e.touches.length === 1) { z.current.px = e.touches[0].clientX; z.current.py = e.touches[0].clientY; }
    };
    const move = (e) => {
      const c = z.current; touch();
      if (e.touches.length === 2) { e.preventDefault(); c.s = Math.min(4, Math.max(1, c.s0 * dist(e.touches) / c.d0)); apply(false); }
      else if (e.touches.length === 1 && c.s > 1) {
        e.preventDefault();
        const w = el.clientWidth * (c.s - 1) / 2, h = el.clientHeight * (c.s - 1) / 2;
        c.x = Math.max(-w, Math.min(w, c.x + e.touches[0].clientX - c.px)); c.y = Math.max(-h, Math.min(h, c.y + e.touches[0].clientY - c.py));
        c.px = e.touches[0].clientX; c.py = e.touches[0].clientY; apply(false);
      }
    };
    const end = (e) => { touch(); if (e.touches.length === 0 && z.current.s < 1.05) { z.current.s = 1; z.current.x = 0; z.current.y = 0; apply(true); setZoomed(false); } };
    el.addEventListener("touchstart", start, { passive: true }); el.addEventListener("touchmove", move, { passive: false }); el.addEventListener("touchend", end); el.addEventListener("touchcancel", end);
    return () => { el.removeEventListener("touchstart", start); el.removeEventListener("touchmove", move); el.removeEventListener("touchend", end); el.removeEventListener("touchcancel", end); };
  }, []);
  useEffect(() => { const c = z.current; if (c.s !== 1) { c.s = 1; c.x = 0; c.y = 0; ref.current && [...ref.current.children].forEach((d) => { const m = d.firstElementChild; if (m) m.style.transform = ""; }); setZoomed(false); } }, [i]);

  useEffect(() => {
    if (!box) return;
    const k = (e) => { if (e.key === "Escape") setBox(false); if (e.key === "ArrowRight") setI((v) => (v + 1) % n); if (e.key === "ArrowLeft") setI((v) => (v - 1 + n) % n); };
    document.body.style.overflow = "hidden"; addEventListener("keydown", k);
    return () => { document.body.style.overflow = ""; removeEventListener("keydown", k); };
  }, [box, n]);
  const key = (e) => { touch(); if (e.key === "ArrowRight") go(i + 1); if (e.key === "ArrowLeft") go(i - 1); };
  return (
    <div className="pg" role="region" aria-roledescription="carousel" aria-label="Product images" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <div className="pg-main">
        <div className={"pg-track" + (zoomed ? " zoomed" : "")} ref={ref} onScroll={upd} tabIndex={0} onKeyDown={key} onPointerDown={() => { touch(); }}>
          {slides.map((s, k) => <div className="pg-slide" key={k} role="group" aria-roledescription="slide" aria-label={`${k + 1} of ${n}`}><Slide s={s} product={product} sub={sub} k={k} /></div>)}
        </div>
        <button className="pg-zoom" aria-label="Open photos full screen" onClick={() => { touch(); setBox(true); }}><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2M11 8v6M8 11h6" /></svg></button>
        {n > 1 && <>
          <button className="pg-arr l" aria-label="Previous image" onClick={() => { touch(); go(i - 1); }}><svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6" /></svg></button>
          <button className="pg-arr r" aria-label="Next image" onClick={() => { touch(); go(i + 1); }}><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>
        </>}
      </div>
      {n > 1 && <div className="pg-dots" role="tablist">{slides.map((s, k) => <button key={k} role="tab" aria-selected={k === i} aria-label={`Image ${k + 1}`} className={k === i ? "on" : ""} onClick={() => { touch(); go(k); }} />)}</div>}
      {box && (
        <div className="pg-lb" role="dialog" aria-modal="true" aria-label="Product photos" onClick={(e) => e.target === e.currentTarget && setBox(false)}>
          <button className="pg-x" aria-label="Close" onClick={() => setBox(false)}><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
          <div className="pg-lb-stage"><div className="pg-lb-slide"><Slide s={slides[i]} product={product} sub={sub} k={i} big /></div></div>
          {n > 1 && <>
            <button className="pg-arr l show" aria-label="Previous image" onClick={() => setI((i - 1 + n) % n)}><svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6" /></svg></button>
            <button className="pg-arr r show" aria-label="Next image" onClick={() => setI((i + 1) % n)}><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>
            <div className="pg-dots lb">{slides.map((s, k) => <button key={k} aria-label={`Image ${k + 1}`} className={k === i ? "on" : ""} onClick={() => setI(k)} />)}</div>
          </>}
        </div>
      )}
    </div>
  );
}
