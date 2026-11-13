"use client";
import { useEffect, useRef, useState } from "react";
import Lightbox from "./Lightbox";

// Product photos: auto-slides every 5s, loops forever in one direction, slow glide.
// Pauses while someone is holding / hovering the photo or has the full-screen viewer open.
export default function Gallery({ images, name }) {
  const n = images.length, loop = n > 1;
  const slides = loop ? [...images, images[0]] : images;
  const [pos, setPos] = useState(0), [anim, setAnim] = useState(true), [hold, setHold] = useState(false), [hover, setHover] = useState(false);
  const [box, setBox] = useState(false), [zoom, setZoom] = useState(false), [org, setOrg] = useState("50% 50%");
  const x0 = useRef(null), mainRef = useRef(null), pz = useRef({ s: 1, x: 0, y: 0 }), [pzs, setPzs] = useState({ s: 1, x: 0, y: 0, sm: false });
  const cur = pos % n;

  const next = () => { if (!loop) return; setAnim(true); setPos((p) => (p >= n ? p : p + 1)); };
  const prev = () => {
    if (!loop) return;
    if (pos === 0) { setAnim(false); setPos(n); setTimeout(() => { setAnim(true); setPos(n - 1); }, 60); } else { setAnim(true); setPos(pos - 1); }
  };
  const to = (k) => { setAnim(true); setPos(k); };
  const ended = () => { if (pos === n) { setAnim(false); setPos(0); } };       // slid onto the clone of image 1: jump back silently
  useEffect(() => { if (anim) return; const id = requestAnimationFrame(() => requestAnimationFrame(() => setAnim(true))); return () => cancelAnimationFrame(id); }, [anim]);
  useEffect(() => { if (!loop || hold || hover || box) return; const t = setInterval(next, 5000); return () => clearInterval(t); }, [loop, hold, hover, box, pos]); // eslint-disable-line

  // pinch-to-zoom on the photo itself (page stays fixed). Pinch out/in, drag when zoomed, double-tap to reset.
  const setZ = (v, sm = false) => { pz.current = v; setPzs({ ...v, sm }); };
  useEffect(() => { setZ({ s: 1, x: 0, y: 0 }, true); }, [cur]); // eslint-disable-line
  useEffect(() => {
    const el = mainRef.current; if (!el) return;
    const g = { d0: 0, s0: 1, sx: 0, sy: 0, ox: 0, oy: 0, mode: "", tap: 0 };
    const clampZ = (v) => { const r = el.getBoundingClientRect(), s = Math.min(4, Math.max(1, v.s)), mx = (r.width * (s - 1)) / 2, my = (r.height * (s - 1)) / 2; return { s, x: s === 1 ? 0 : Math.max(-mx, Math.min(mx, v.x)), y: s === 1 ? 0 : Math.max(-my, Math.min(my, v.y)) }; };
    const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    const start = (e) => {
      if (e.touches.length === 2) { g.mode = "pinch"; g.d0 = dist(e.touches); g.s0 = pz.current.s; e.preventDefault(); setHold(true); }
      else if (e.touches.length === 1) { g.sx = e.touches[0].clientX; g.sy = e.touches[0].clientY; g.ox = pz.current.x; g.oy = pz.current.y; g.mode = pz.current.s > 1 ? "pan" : ""; }
    };
    const move = (e) => {
      if (g.mode === "pinch" && e.touches.length === 2) {
        e.preventDefault(); const r = el.getBoundingClientRect(), t = e.touches;
        const cx = (t[0].clientX + t[1].clientX) / 2 - r.left - r.width / 2, cy = (t[0].clientY + t[1].clientY) / 2 - r.top - r.height / 2;
        const ns = Math.min(4, Math.max(1, g.s0 * (dist(t) / g.d0))), k = ns / pz.current.s, o = pz.current;
        setZ(clampZ({ s: ns, x: cx - (cx - o.x) * k, y: cy - (cy - o.y) * k }));
      } else if (g.mode === "pan" && e.touches.length === 1) {
        e.preventDefault(); setZ(clampZ({ s: pz.current.s, x: g.ox + e.touches[0].clientX - g.sx, y: g.oy + e.touches[0].clientY - g.sy }));
      }
    };
    const end = (e) => {
      if (e.touches.length === 0) {
        if (g.mode === "pinch" && pz.current.s < 1.06) setZ({ s: 1, x: 0, y: 0 }, true);
        const moved = Math.abs((e.changedTouches[0]?.clientX || 0) - g.sx) + Math.abs((e.changedTouches[0]?.clientY || 0) - g.sy) > 10;
        if (!g.mode && !moved && pz.current.s > 1) { const now = Date.now(); if (now - g.tap < 320) setZ({ s: 1, x: 0, y: 0 }, true); g.tap = now; }
        else if (g.mode === "pan" && !moved) { const now = Date.now(); if (now - g.tap < 320) setZ({ s: 1, x: 0, y: 0 }, true); g.tap = now; }
        g.mode = ""; setHold(pz.current.s > 1);
      } else if (e.touches.length === 1) { g.mode = pz.current.s > 1 ? "pan" : ""; g.sx = e.touches[0].clientX; g.sy = e.touches[0].clientY; g.ox = pz.current.x; g.oy = pz.current.y; }
    };
    el.addEventListener("touchstart", start, { passive: false }); el.addEventListener("touchmove", move, { passive: false }); el.addEventListener("touchend", end); el.addEventListener("touchcancel", end);
    return () => { el.removeEventListener("touchstart", start); el.removeEventListener("touchmove", move); el.removeEventListener("touchend", end); el.removeEventListener("touchcancel", end); };
  }, [loop]); // eslint-disable-line
  const move = (e) => { const r = e.currentTarget.getBoundingClientRect(); setOrg(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`); };
  const swipe = { onTouchStart: (e) => { x0.current = e.touches.length === 1 ? e.touches[0].clientX : null; }, onTouchEnd: (e) => { if (x0.current == null || !loop || pz.current.s > 1.02) { x0.current = null; return; } const d = e.changedTouches[0].clientX - x0.current; if (Math.abs(d) > 45) (d < 0 ? next : prev)(); x0.current = null; } };
  const holdProps = { onPointerDown: () => setHold(true), onPointerUp: () => setHold(false), onPointerCancel: () => setHold(false), onPointerLeave: () => { setHold(false); setHover(false); }, onPointerEnter: (e) => e.pointerType === "mouse" && setHover(true) };

  return (
    <div className="gal">
      <div className="gal-main" ref={mainRef} {...swipe} {...holdProps}>
        
        {n ? (
          <div className="gal-track" style={{ transform: `translateX(-${pos * 100}%)`, transition: anim ? "transform 1.1s cubic-bezier(.65,0,.35,1)" : "none" }} onTransitionEnd={ended}>
            {slides.map((src, k) => (
              <div className="gal-slide" key={k} aria-hidden={k % n !== cur}>
                <button className="gal-zoom" onMouseMove={move} onClick={() => { setZoom(false); setBox(true); }} aria-label="Open photo full screen"><img src={src} alt={`${name}, view ${(k % n) + 1}`} style={k % n === cur && (pzs.s > 1 || pzs.sm) ? { transform: `translate(${pzs.x}px,${pzs.y}px) scale(${pzs.s})`, transition: pzs.sm ? "transform .3s cubic-bezier(.2,.8,.2,1)" : "none", transformOrigin: "50% 50%" } : { transformOrigin: org }} fetchPriority={k === 0 ? "high" : undefined} decoding="async" draggable="false" /></button>
              </div>
            ))}
          </div>
        ) : <span className="corners" />}
        {n > 0 && <button className="gal-zbtn" aria-label="Zoom photo" onClick={() => { setZoom(true); setBox(true); }}><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2M11 8v6M8 11h6" /></svg><span>Zoom</span></button>}
        {loop && <div className="gal-dots" aria-hidden="true">{images.map((_, k) => <i key={k} className={k === cur ? "on" : ""} />)}</div>}
      </div>
      {loop && <div className="thumbs">{images.map((src, k) => <button key={k} className={k === cur ? "on" : ""} aria-label={`Show image ${k + 1}`} onClick={() => to(k)}><img src={src} alt="" loading="lazy" decoding="async" /></button>)}</div>}
      {box && <Lightbox images={images} index={cur} name={name} startZoom={zoom} onClose={() => setBox(false)} onIndex={(k) => setPos(k)} />}
    </div>
  );
}
