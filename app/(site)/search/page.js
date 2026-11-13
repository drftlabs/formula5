import Link from "next/link";
import { getProducts, getColors } from "@/lib/data";
import ProductGrid from "@/components/ProductGrid";

export const dynamic = "force-dynamic";
export const metadata = { title: "Search", robots: { index: false } };

export default async function Search({ searchParams }) {
  const q = String(searchParams.q || "").slice(0, 80);
  const [products, colors] = await Promise.all([getProducts({ search: q }), getColors()]);
  return (
    <div className="page"><div className="wrap">
      <div className="crumbs"><Link href="/">Home</Link><span>Search</span></div>
      <h1 className="page-title">Results for <em>“{q}”</em></h1>
      <p className="lead">{products.length} {products.length === 1 ? "pair" : "pairs"} found.</p>
      {products.length ? <ProductGrid products={products} colors={colors} collapse={false} /> : <p className="empty-state">Nothing matched. Try a different name, or <Link className="link" href="/collections/all">browse everything</Link>.</p>}
    </div></div>
  );
}
