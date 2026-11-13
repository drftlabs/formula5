"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import ProductCard from "./ProductCard";

// Shows two full rows, a peek of the third under a blurred black tint, and a View all button that opens the rest.
export default function ProductGrid({ products, colors = [], collapse = true, rows = 2 }) {
  const colorMap = Object.fromEntries(colors.map((c) => [c.slug, c]));
  const gridRef = useRef(), [open, setOpen] = useState(false), [limit, setLimit] = useState(Infinity);
  const [mh, setMh] = useState("none"), [fade, setFade] = useState(190), [collapsedH, setCH] = useState(0);
  const collapsible = collapse && products.length > limit;

  const measure = useCallback(() => {
    const g = gridRef.current; if (!g) return;
    const cards = [...g.children];
    const cols = getComputedStyle(g).gridTemplateColumns.split(" ").length, lim = cols * Math.max(1, rows);
    setLimit(lim);
    if (!collapse || cards.length <= lim) { setMh("none"); return; }
    const gap = parseFloat(getComputedStyle(g).rowGap) || 0, peek = Math.round(gap * 0.9 + 90), last = cards[lim - 1];
    const h = last.offsetTop + last.offsetHeight + peek;
    setFade(peek + 40); setCH(h);
    setMh((cur) => (open ? "none" : h + "px"));
  }, [collapse, rows, open, products.length]);

  useLayoutEffect(() => { measure(); }, [measure]);
  useEffect(() => {
    let t; const on = () => { clearTimeout(t); t = setTimeout(measure, 120); };
    addEventListener("resize", on); document.fonts?.ready?.then(measure);
    return () => { removeEventListener("resize", on); clearTimeout(t); };
  }, [measure]);

  const toggle = () => {
    const g = gridRef.current;
    if (!open) { setMh(g.offsetHeight + "px"); setOpen(true); setTimeout(() => setMh("none"), 850); }
    else {
      setMh(g.offsetHeight + "px");
      requestAnimationFrame(() => requestAnimationFrame(() => { setOpen(false); setMh(collapsedH + "px"); }));
      document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className={"catalog" + (collapsible ? " collapsible" : "") + (open ? " open" : "")} style={{ "--fade-h": fade + "px" }}>
      <div className="clip" style={{ maxHeight: mh }}>
        <div className="grid" ref={gridRef}>
          {products.map((p, i) => <ProductCard key={p.id} p={p} colorMap={colorMap} extra={collapsible && i >= limit} inert={collapsible && !open && i >= limit} index={Math.max(0, i - limit)} />)}
        </div>
      </div>
      <div className="fade-bg" aria-hidden="true" />
      <div className="more">
        <button className="viewall" aria-expanded={open} onClick={toggle}>
          <span>{open ? "Show less" : "View all"}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v16M5 13l7 7 7-7" /></svg>
        </button>
      </div>
    </div>
  );
}
