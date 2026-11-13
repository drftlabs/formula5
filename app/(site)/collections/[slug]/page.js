import Link from "next/link";
import { notFound } from "next/navigation";
import { getCollectionBySlug, getProducts, getColors } from "@/lib/data";
import ProductGrid from "@/components/ProductGrid";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  if (params.slug === "all") return { title: "Shop all sneakers" };
  const c = await getCollectionBySlug(params.slug);
  return { title: c ? c.name : "Collection" };
}

const SORTS = [["", "Featured"], ["price-asc", "Price: low to high"], ["price-desc", "Price: high to low"]];

export default async function Collection({ params, searchParams }) {
  const all = params.slug === "all";
  const col = all ? { name: "All sneakers", slug: "all", kanji: "街" } : await getCollectionBySlug(params.slug);
  if (!col) notFound();
  const sort = SORTS.some(([k]) => k === (searchParams.sort || "")) ? searchParams.sort || "" : "";
  const [products, colors] = await Promise.all([getProducts({ collectionId: all ? undefined : col.id, sort }), getColors()]);
  const words = col.name.split(" ");
  return (
    <div className="page">
      <div className="wrap">
        <div className="crumbs"><Link href="/">Home</Link><span>Shop</span><span>{col.name}</span></div>
        <div className="col-head">
          <div><p className="eyebrow">{all ? "The full rotation" : "Collection"}</p><h1 className="page-title">{words.slice(0, -1).join(" ")} <em>{words.slice(-1)}</em></h1><span className="note"><b>{products.length}</b> pairs</span></div>
          <div className="sortbar" aria-label="Sort">{SORTS.map(([k, l]) => <Link key={k} href={k ? `?sort=${k}` : "?"} className={sort === k ? "on" : ""} scroll={false}>{l}</Link>)}</div>
        </div>
        {products.length ? <ProductGrid products={products} colors={colors} collapse={false} /> : <p className="empty-state">No pairs in this collection yet. Check back soon.</p>}
      </div>
    </div>
  );
}
