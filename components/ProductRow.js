"use client";
import { useRef, useState, useEffect, useCallback } from "react";
import ProductCard from "./ProductCard";

// Swipeable row on phones (scroll-snap), arrows on desktop.
export default function ProductRow({ products, catMap = {}, tagMap = {}, label = "Products" }) {
  const ref = useRef();
  const [edge, setEdge] = useState({ start: true, end: false });
  const upd = useCallback(() => { const el = ref.current; if (!el) return; setEdge({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 }); }, []);
  useEffect(() => { upd(); addEventListener("resize", upd); return () => removeEventListener("resize", upd); }, [upd]);
  const step = (d) => { const el = ref.current; if (el) el.scrollBy({ left: d * (el.clientWidth * 0.8), behavior: "smooth" }); };
  return (
    <div className="f5-rowwrap">
      <div className="f5-scroll f5-row" ref={ref} onScroll={upd} role="region" aria-label={label} tabIndex={0}>
        {products.map((p) => <ProductCard key={p.id} p={p} category={catMap[p.category]?.name} accent={catMap[p.category]?.accent} tagMap={tagMap} />)}
      </div>
      <div className="f5-nav2">
        <button aria-label="Scroll back" disabled={edge.start} onClick={() => step(-1)}><svg viewBox="0 0 24 24"><path d="M19 12H5M11 6l-6 6 6 6" /></svg></button>
        <button aria-label="Scroll forward" disabled={edge.end} onClick={() => step(1)}><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6" /></svg></button>
      </div>
    </div>
  );
}
