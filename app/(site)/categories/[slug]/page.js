import { notFound } from "next/navigation";
import Listing, { sortOf } from "@/components/Listing";
import { getProducts, getCategories, getConcerns, getTags } from "@/lib/data";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  const c = (await getCategories()).find((x) => x.slug === params.slug);
  return c ? { title: c.name, description: c.description } : { title: "Category" };
}
export default async function Category({ params, searchParams }) {
  const [categories, concerns, tags] = await Promise.all([getCategories(), getConcerns(), getTags()]);
  const cat = categories.find((c) => c.slug === params.slug); if (!cat) notFound();
  const sort = sortOf(searchParams.sort), concern = searchParams.concern || "";
  const products = await getProducts({ category: cat.slug, concern: concern || undefined, sort });
  return <Listing crumbs={[["Shop", "/products"], [cat.name]]} eyebrow="Category" title={cat.name} lede={cat.description} products={products} categories={categories} concerns={concerns} tags={tags} active={{ concern }} sort={sort} path={`/categories/${cat.slug}`} emptyNote="No products in this category yet." />;
}
