import Listing, { sortOf } from "@/components/Listing";
import { getProducts, getCategories, getTags } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Search", robots: { index: false } };

export default async function Search({ searchParams }) {
  const q = String(searchParams.q || "").slice(0, 80), sort = sortOf(searchParams.sort);
  const [products, categories, tags] = await Promise.all([getProducts({ search: q, sort }), getCategories(), getTags()]);
  return <Listing crumbs={[["Search"]]} eyebrow="Search" title={q ? `Results for “${q}”` : "Search"} products={products} categories={[]} tags={tags} sort={sort} path={`/search?q=${encodeURIComponent(q)}`.split("?")[0]} active={{ q }} emptyNote="Nothing matched. Try a different name." />;
}
