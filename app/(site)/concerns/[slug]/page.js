import { notFound } from "next/navigation";
import Listing, { sortOf } from "@/components/Listing";
import { getProducts, getCategories, getConcerns, getTags } from "@/lib/data";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }) {
  const c = (await getConcerns()).find((x) => x.slug === params.slug);
  return { title: c ? `Shop for ${c.name}` : "Concern" };
}
export default async function Concern({ params, searchParams }) {
  const [categories, concerns, tags] = await Promise.all([getCategories(), getConcerns(), getTags()]);
  const con = concerns.find((c) => c.slug === params.slug); if (!con) notFound();
  const sort = sortOf(searchParams.sort), category = searchParams.category || "";
  const products = await getProducts({ concern: con.slug, category: category || undefined, sort });
  return <Listing crumbs={[["Shop", "/products"], [con.name]]} eyebrow="Shop by concern" title={con.name} lede={con.description || `Products lined up for ${con.name.toLowerCase()}, each with the hero active stated on the pack.`} products={products} categories={categories} tags={tags} active={{ category }} sort={sort} path={`/concerns/${con.slug}`} emptyNote="No products for this concern yet." />;
}
