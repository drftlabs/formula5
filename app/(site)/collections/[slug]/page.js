import { notFound } from "next/navigation";
import Listing, { sortOf } from "@/components/Listing";
import { getCollectionBySlug, getProducts, getCategories, getConcerns, getTags } from "@/lib/data";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  if (params.slug === "all") return { title: "Shop all products" };
  const c = await getCollectionBySlug(params.slug);
  return { title: c ? c.name : "Collection" };
}
export default async function Collection({ params, searchParams }) {
  const all = params.slug === "all";
  const col = all ? { name: "All products", slug: "all" } : await getCollectionBySlug(params.slug);
  if (!col) notFound();
  const sort = sortOf(searchParams.sort);
  const [products, categories, concerns, tags] = await Promise.all([getProducts({ collectionId: all ? undefined : col.id, sort }), getCategories(), getConcerns(), getTags()]);
  return <Listing crumbs={[["Shop", "/products"], [col.name]]} eyebrow={all ? "The full range" : "Collection"} title={col.name} products={products} categories={all ? categories : []} concerns={all ? concerns : []} tags={tags} sort={sort} path={`/collections/${col.slug}`} />;
}
