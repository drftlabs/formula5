"use client";
import { useEffect, useState } from "react";
import ProductGrid from "./ProductGrid";

// Remembers the last products you looked at (on this device) and shows the others below the description.
export default function RecentlyViewed({ slug }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    let list = [];
    try { list = JSON.parse(localStorage.getItem("tk_recent") || "[]"); } catch {}
    const others = list.filter((s) => s !== slug).slice(0, 4);
    try { localStorage.setItem("tk_recent", JSON.stringify([slug, ...list.filter((s) => s !== slug)].slice(0, 12))); } catch {}
    if (!others.length) return;
    fetch(`/api/products?slugs=${encodeURIComponent(others.join(","))}`).then((r) => (r.ok ? r.json() : null)).then((d) => d?.products?.length && setData(d)).catch(() => {});
  }, [slug]);
  if (!data) return null;
  return (
    <section className="related recent"><div className="sec-head"><div><p className="eyebrow">Your trail</p><h2 className="h2">Recently <em>viewed</em></h2></div></div>
      <ProductGrid products={data.products} colors={data.colors} collapse={false} /></section>
  );
}
