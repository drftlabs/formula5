"use client";
import { useEffect, useRef, useState } from "react";
import { Media, SmartLink, Arrow, lines } from "./Media";
import Art from "./Art";
import { splitName } from "@/lib/format";

const SECONDS = 5.5;
const mod = (a, n) => ((a % n) + n) % n;

// Slides loop forever with a smooth horizontal slide. Auto-advances, pauses on hover / touch / focus / off-screen, swipeable.
export default function Hero({ slides, products = [] }) {
  const N = slides.length;
  const list = N === 2 ? [...slides, ...slides] : slides; // two slides are doubled so the loop always has a neighbour
  const L = list.length;
  const [cur, setCur] = useState(0);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [hold, setHold] = useState({ hover: false, focus: false, touch: false, off: false, hidden: false });
  const [reduce, setReduce] = useState(false);
  const ref = useRef(), st = useRef(null), prevD = useRef([]), moved = useRef(false);
  const held = Object.values(hold).some(Boolean) || dragging;
  const go = (n) => setCur((c) => mod(typeof n === "function" ? n(c) : n, L));
  const setH = (k, v) => setHold((h) => (h[k] === v ? h : { ...h, [k]: v }));

  useEffect(() => { const m = matchMedia("(prefers-reduced-motion: reduce)"); setReduce(m.matches); }, []);
  useEffect(() => {
    const io = new IntersectionObserver((e) => setH("off", !e[0].isIntersecting), { threshold: 0.3 });
    ref.current && io.observe(ref.current);
    const vis = () => setH("hidden", document.hidden);
    document.addEventListener("visibilitychange", vis);
    return () => { io.disconnect(); document.removeEventListener("visibilitychange", vis); };
  }, []);
  useEffect(() => {
    if (L < 2 || reduce || held) return;
    const id = setTimeout(() => go((c) => c + 1), SECONDS * 1000);
    return () => clearTimeout(id);
  }, [cur, held, reduce, L]); // eslint-disable-line

  const bySlug = (s) => products.find((p) => p.slug.startsWith(s.trim()));
  const D = list.map((_, i) => { const h = Math.floor(L / 2); return mod(i - cur + h, L) - h; });
  useEffect(() => { prevD.current = D; });

  const down = (e) => {
    if (L < 2 || (e.pointerType === "mouse" && e.button !== 0)) return;
    st.current = { x: e.clientX, y: e.clientY, t: performance.now(), id: e.pointerId, active: false };
    moved.current = false;
    if (e.pointerType !== "mouse") setH("touch", true);
  };
  const move = (e) => {
    const s = st.current; if (!s) return;
    const dx = e.clientX - s.x, dy = e.clientY - s.y;
    if (!s.active) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) { s.active = true; setDragging(true); try { e.currentTarget.setPointerCapture(s.id); } catch {} }
      else return;
    }
    setDrag(dx);
  };
  const up = (e) => {
    const s = st.current; st.current = null; setH("touch", false);
    if (!s || !s.active) return;
    const dx = e.clientX - s.x, w = ref.current?.offsetWidth || 1, v = Math.abs(dx) / Math.max(1, performance.now() - s.t);
    moved.current = true; setDragging(false); setDrag(0);
    if (Math.abs(dx) > w * 0.14 || v > 0.45) go((c) => c + (dx < 0 ? 1 : -1));
  };
  if (!N) return null;
  const dur = SECONDS * 1000 + "ms";
  const active = mod(cur, N);

  return (
    <section ref={ref} className="f5-hero" aria-roledescription="carousel" aria-label="Featured"
      style={{ "--dur": dur }}
      onPointerEnter={(e) => e.pointerType === "mouse" && setH("hover", true)} onPointerLeave={() => setH("hover", false)}
      onFocus={() => setH("focus", true)} onBlur={() => setH("focus", false)}
      onKeyDown={(e) => { if (e.key === "ArrowRight") go(cur + 1); if (e.key === "ArrowLeft") go(cur - 1); }}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
      onClickCapture={(e) => { if (moved.current) { e.preventDefault(); e.stopPropagation(); moved.current = false; } }}>
      <div className="f5-slides" aria-live={held ? "polite" : "off"}>
        {list.map((s, i) => {
          const on = i === cur, dup = N === 2 && i >= 2;
          const snap = dragging || Math.abs(D[i] - (prevD.current[i] ?? D[i])) > 1;
          const art = String(s.art || "").split(",").filter(Boolean).map(bySlug).filter(Boolean);
          const H = i === 0 ? "h1" : "h2";
          return (
            <article key={i} className={"f5-slide" + (on ? " on" : "") + (snap ? " snap" : "")} role="group" aria-roledescription="slide" aria-label={`${(i % N) + 1} of ${N}`}
              aria-hidden={!on || dup ? true : undefined} inert={on ? undefined : ""}
              style={{ "--acc": s.accent || "#B7B7AE", transform: `translate3d(calc(${D[i] * 100}% + ${drag}px),0,0)` }}>
              {s.image ? <><Media src={s.image} mobile={s.image_mobile} alt="" position={s.position} priority={i === 0} /><div className="f5-scrim" /></> : (
                <div className="f5-art"><Art items={art} />{art[0] && <span className="f5-art-num" aria-hidden="true">{splitName(art[0].name).amount}</span>}</div>
              )}
              <div className="f5-copy">
                {s.kicker && <div className="f5-kick">{s.kicker}</div>}
                <H className="f5-hl">{lines(s.title)}</H>
                {s.subtext && <p className="f5-sub">{s.subtext}</p>}
                <div className="f5-ctas">
                  {s.cta_text && <SmartLink className="btn" href={s.link}>{s.cta_text}<Arrow /></SmartLink>}
                  {s.cta2_text && <SmartLink className="btn ghost" href={s.cta2_link}>{s.cta2_text}</SmartLink>}
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {N > 1 && (
        <div className="f5-hud">
          <div className="f5-dots">
            {slides.map((s, i) => (
              <button key={i} className={"f5-dot" + (i < active ? " done" : "") + (i === active ? " on" + (held || reduce ? " held" : "") : "")} aria-label={`Go to slide ${i + 1}`} aria-current={i === active} onClick={() => go(i)}>
                <span><i key={i === active ? `r${cur}-${held}` : i} /></span>
              </button>
            ))}
          </div>
          <div className="f5-hud-r">
            <span className="f5-count-n" aria-hidden="true"><b>{String(active + 1).padStart(2, "0")}</b> / {String(N).padStart(2, "0")}</span>
            <div className="f5-arrows">
              <button aria-label="Previous slide" onClick={() => go(cur - 1)}><svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6" /></svg></button>
              <button aria-label="Next slide" onClick={() => go(cur + 1)}><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
