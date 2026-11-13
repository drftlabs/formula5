"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Full-screen photo viewer. Rendered in a portal so it always sits above the header.
// Pinch / wheel / double-tap / +- buttons to zoom, drag to pan, swipe to change photo when not zoomed.
const MAX = 4;
export default function Lightbox({ images, index, name, onClose, onIndex, startZoom = false }) {
  const n = images.length;
  const [t, setT] = useState({ s: 1, x: 0, y: 0 }), [smooth, setSmooth] = useState(false), [ready, setReady] = useState(false);
  const tr = useRef(t), box = useRef(), pts = useRef(new Map()), g = useRef({}), last = useRef(0);
  const set = (v, sm = false) => { tr.current = v; setSmooth(sm); setT(v); };
  const clamp = (v) => {
    const r = box.current.getBoundingClientRect(), s = Math.min(MAX, Math.max(1, v.s));
    const mx = (r.width * (s - 1)) / 2, my = (r.height * (s - 1)) / 2;
    return { s, x: s === 1 ? 0 : Math.max(-mx, Math.min(mx, v.x)), y: s === 1 ? 0 : Math.max(-my, Math.min(my, v.y)) };
  };
  const zoomTo = (s, cx = 0, cy = 0, sm = true) => {   // cx/cy: point relative to box centre that stays put
    const o = tr.current, k = Math.min(MAX, Math.max(1, s)) / o.s;
    set(clamp({ s: o.s * k, x: cx - (cx - o.x) * k, y: cy - (cy - o.y) * k }), sm);
  };
  const go = (d) => { set({ s: 1, x: 0, y: 0 }); onIndex((index + d + n) % n); };

  useEffect(() => { setReady(true); document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = ""; }; }, []);
  useEffect(() => { set({ s: 1, x: 0, y: 0 }); }, [index]); // eslint-disable-line
  useEffect(() => { if (startZoom && ready) zoomTo(2.4); }, [ready]); // eslint-disable-line
  useEffect(() => {
    const k = (e) => { if (e.key === "Escape") onClose(); if (e.key === "ArrowRight" && n > 1) go(1); if (e.key === "ArrowLeft" && n > 1) go(-1); if (e.key === "+" || e.key === "=") zoomTo(tr.current.s * 1.6); if (e.key === "-") zoomTo(tr.current.s / 1.6); };
    addEventListener("keydown", k); return () => removeEventListener("keydown", k);
  }); // eslint-disable-line

  // pointer handling (touch + mouse + pen)
  const ctr = (e) => { const r = box.current.getBoundingClientRect(); return [e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2]; };
  const down = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId); pts.current.set(e.pointerId, [e.clientX, e.clientY]);
    g.current = { sx: e.clientX, sy: e.clientY, ox: tr.current.x, oy: tr.current.y, moved: false, t0: Date.now() };
    if (pts.current.size === 2) { const [a, b] = [...pts.current.values()]; g.current.d0 = Math.hypot(a[0] - b[0], a[1] - b[1]); g.current.s0 = tr.current.s; g.current.pinch = true; }
  };
  const move = (e) => {
    if (!pts.current.has(e.pointerId)) return; pts.current.set(e.pointerId, [e.clientX, e.clientY]);
    const G = g.current;
    if (pts.current.size >= 2 && G.d0) {
      const [a, b] = [...pts.current.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]), r = box.current.getBoundingClientRect();
      const cx = (a[0] + b[0]) / 2 - r.left - r.width / 2, cy = (a[1] + b[1]) / 2 - r.top - r.height / 2;
      const s = Math.min(MAX, Math.max(1, G.s0 * (d / G.d0))), k = s / tr.current.s, o = tr.current;
      set(clamp({ s, x: cx - (cx - o.x) * k, y: cy - (cy - o.y) * k })); G.moved = true; return;
    }
    if (G.pinch) return;
    const dx = e.clientX - G.sx, dy = e.clientY - G.sy;
    if (Math.abs(dx) + Math.abs(dy) > 6) G.moved = true;
    if (tr.current.s > 1) set(clamp({ s: tr.current.s, x: G.ox + dx, y: G.oy + dy }));
  };
  const up = (e) => {
    const G = g.current; pts.current.delete(e.pointerId);
    if (pts.current.size > 0) { const [p] = [...pts.current.values()]; g.current = { ...G, d0: 0, sx: p[0], sy: p[1], ox: tr.current.x, oy: tr.current.y }; return; }
    if (G.pinch) { g.current = {}; return; }
    const dx = e.clientX - G.sx, dy = e.clientY - G.sy;
    if (tr.current.s === 1 && n > 1 && Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) { go(dx < 0 ? 1 : -1); return; }
    if (!G.moved) {                                   // tap: double-tap toggles zoom
      const now = Date.now(); if (now - last.current < 320) { const [cx, cy] = ctr(e); tr.current.s > 1 ? set({ s: 1, x: 0, y: 0 }, true) : zoomTo(2.6, cx, cy); last.current = 0; } else last.current = now;
    }
  };
  const wheel = (e) => { e.preventDefault(); const [cx, cy] = ctr(e); zoomTo(tr.current.s * (e.deltaY < 0 ? 1.25 : 0.8), cx, cy, false); };
  useEffect(() => { const el = box.current; if (!el) return; el.addEventListener("wheel", wheel, { passive: false }); return () => el.removeEventListener("wheel", wheel); }); // eslint-disable-line

  if (!ready && typeof document === "undefined") return null;
  const zoomed = t.s > 1.01;
  return createPortal(
    <div className="lb" role="dialog" aria-modal="true" aria-label={`${name} photos`}>
      <div className="lb-top">
        <span className="lb-c">{index + 1} / {n}</span>
        <div className="lb-tools">
          <button aria-label="Zoom out" disabled={!zoomed} onClick={() => zoomTo(tr.current.s / 1.7)}>−</button>
          <button aria-label="Zoom in" disabled={t.s >= MAX} onClick={() => zoomTo(tr.current.s * 1.7)}>+</button>
          <button className="lb-close" aria-label="Close" onClick={onClose}><svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5L5 19" /></svg></button>
        </div>
      </div>
      <div className={"lb-stage" + (zoomed ? " zoomed" : "")} ref={box} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <img src={images[index]} alt={`${name}, view ${index + 1}`} draggable="false" style={{ transform: `translate(${t.x}px,${t.y}px) scale(${t.s})`, transition: smooth ? "transform .28s cubic-bezier(.2,.8,.2,1)" : "none" }} />
      </div>
      {n > 1 && !zoomed && <><button className="lb-n prev" aria-label="Previous photo" onClick={() => go(-1)}>‹</button><button className="lb-n next" aria-label="Next photo" onClick={() => go(1)}>›</button></>}
      <p className="lb-h">{zoomed ? "Drag to look around · double-tap to reset" : "Pinch or double-tap to zoom"}</p>
    </div>, document.body);
}
