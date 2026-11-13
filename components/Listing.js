import Link from "next/link";
import ProductCard from "./ProductCard";

const SORTS = [["", "Featured"], ["price-asc", "Price: low to high"], ["price-desc", "Price: high to low"]];
export const sortOf = (v) => (SORTS.some(([k]) => k === (v || "")) ? v || "" : "");

// Shared shop layout: crumbs, serif title, filter chips, sort and a product grid. Used by shop, category, concern, collection and search.
export default function Listing({ crumbs = [], eyebrow, title, lede, products, categories = [], concerns = [], tags = [], active = {}, sort = "", path = "/products", emptyNote }) {
  const catMap = Object.fromEntries(categories.map((c) => [c.slug, c])), tagMap = Object.fromEntries(tags.map((t) => [t.slug, t]));
  const href = (o) => { const p = new URLSearchParams(); const m = { ...active, sort, ...o }; for (const [k, v] of Object.entries(m)) if (v) p.set(k, v); const s = p.toString(); return path + (s ? "?" + s : ""); };
  const words = String(title).split(" ");
  return (
    <div className="f5-list">
      <div className="f5-wrap f5-pad">
        <nav className="pd-crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link>{crumbs.map(([l, h]) => (h ? <Link key={l} href={h}>{l}</Link> : <span key={l} aria-current="page">{l}</span>))}</nav>
        <header className="f5-lh">
          {eyebrow && <p className="f5-eyebrow">{eyebrow}</p>}
          <h1 className="f5-h2">{words.length > 1 ? <>{words.slice(0, -1).join(" ")} <em>{words.slice(-1)}</em></> : title}</h1>
          {lede && <p className="f5-lede">{lede}</p>}
        </header>
        {(categories.length > 0 || concerns.length > 0) && (
          <div className="f5-filters">
            {categories.length > 0 && <div className="f5-fl"><span>Category</span><div>{[{ slug: "", name: "All" }, ...categories].map((c) => <Link key={c.slug} href={href({ category: c.slug })} scroll={false} className={"f5-chip2" + ((active.category || "") === c.slug ? " on" : "")} style={{ "--acc": c.accent }}>{c.name}</Link>)}</div></div>}
            {concerns.length > 0 && <div className="f5-fl"><span>Concern</span><div>{[{ slug: "", name: "All" }, ...concerns].map((c) => <Link key={c.slug} href={href({ concern: c.slug })} scroll={false} className={"f5-chip2" + ((active.concern || "") === c.slug ? " on" : "")} style={{ "--acc": c.accent }}>{c.name}</Link>)}</div></div>}
          </div>
        )}
        <div className="f5-lbar">
          <span><b>{products.length}</b> product{products.length === 1 ? "" : "s"}</span>
          <div className="sortbar" aria-label="Sort">{SORTS.map(([k, l]) => <Link key={k} href={href({ sort: k })} className={sort === k ? "on" : ""} scroll={false}>{l}</Link>)}</div>
        </div>
        {products.length ? (
          <div className="f5-grid">{products.map((p) => <ProductCard key={p.id} p={p} category={catMap[p.category]?.name} accent={catMap[p.category]?.accent} tagMap={tagMap} />)}</div>
        ) : <p className="empty-state">{emptyNote || "Nothing here yet."} <Link className="f5-link" href="/products">Browse all products</Link></p>}
      </div>
    </div>
  );
}
