import Link from "next/link";
import { getProducts, getCategories } from "@/lib/data";
import { splitName, activeLabel, inr } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hero actives", description: "The hero active in every Formula 5 product, with its percentage." };

// Built from the product list, so it never goes out of date. Each row: percentage, active, product.
export default async function Ingredients() {
  const [products, categories] = await Promise.all([getProducts(), getCategories()]);
  const groups = categories.map((c) => ({ c, items: products.filter((p) => p.category === c.slug && splitName(p.name).amount) })).filter((g) => g.items.length);
  return (
    <div className="f5-list">
      <div className="f5-wrap f5-pad">
        <nav className="pd-crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-current="page">Hero actives</span></nav>
        <header className="f5-lh"><p className="f5-eyebrow">Ingredients</p><h1 className="f5-h2">Meet the hero <em>actives.</em></h1><p className="f5-lede">One hero active per product, with its percentage stated on the pack. Pick a product to see its full ingredient list.</p></header>
        {groups.map(({ c, items }) => (
          <section key={c.slug} className="ing-g" style={{ "--acc": c.accent }}>
            <h2><i />{c.name}</h2>
            <ul>{items.map((p) => { const { short, amount, inci } = splitName(p.name); const k = p.packs?.[0] || { price: p.price }; return (
              <li key={p.id}><Link href={`/products/${p.slug}`}><b className="ing-pct">{amount}</b><span className="ing-name">{activeLabel(inci)}</span><span className="ing-prod">{short}</span><span className="ing-price">{inr(k.price)}</span></Link></li>
            ); })}</ul>
          </section>
        ))}
      </div>
    </div>
  );
}
