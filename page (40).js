import Listing, { sortOf } from "@/components/Listing";
import { getProducts, getCategories, getConcerns, getTags } from "@/lib/data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Shop all products", description: "Skincare, hair care and supplements built around one hero active, stated with its percentage." };

export default async function Shop({ searchParams }) {
  const sort = sortOf(searchParams.sort), category = searchParams.category || "", concern = searchParams.concern || "";
  const [products, categories, concerns, tags] = await Promise.all([getProducts({ category: category || undefined, concern: concern || undefined, sort }), getCategories(), getConcerns(), getTags()]);
  return <Listing crumbs={[["Shop"]]} eyebrow="The full range" title="All products" lede="Every Formula 5 product is built around one hero active, with its percentage stated on the pack." products={products} categories={categories} concerns={concerns} tags={tags} active={{ category, concern }} sort={sort} />;
}
