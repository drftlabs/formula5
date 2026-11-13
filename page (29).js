import { getBlocks, getSlides, getCategories, getConcerns, getProducts, getReviews, getTags, getCollections, inCollection } from "@/lib/data";
import { HeroBlock, CategoriesBlock, ConcernsBlock, ProductsBlock, RoutineBlock, EditorialBlock, PromosBlock, WhyBlock, TestimonialsBlock, NewsletterBlock } from "@/components/HomeBlocks";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [blocks, slides, categories, concerns, collections, tags, reviews, all] = await Promise.all([getBlocks(), getSlides(), getCategories(), getConcerns(), getCollections(), getTags(), getReviews(), getProducts()]);
  const bySlug = Object.fromEntries(collections.map((c) => [c.slug, c]));
  // which products a row shows: everything, a tag (e.g. bestseller), a category, a concern, a collection or a hand-picked list
  const productsFor = (c) => {
    let list = all;
    if (c.source === "pick") { const ids = Array.isArray(c.product_ids) ? c.product_ids : []; return ids.map((id) => all.find((p) => p.id === id)).filter(Boolean); }
    if (c.source === "tag" && c.source_value) list = list.filter((p) => (p.tags || []).includes(c.source_value));
    if (c.source === "category" && c.source_value) list = list.filter((p) => p.category === c.source_value);
    if (c.source === "concern" && c.source_value) list = list.filter((p) => (p.concerns || []).includes(c.source_value));
    if (c.source === "collection" && c.source_value && bySlug[c.source_value]) list = list.filter((p) => inCollection(p, bySlug[c.source_value].id));
    return list.slice(0, Number(c.limit) || 8);
  };
  return (
    <>
      {blocks.map((b) => {
        const c = { ...(b.config || {}) };
        c.title = c.title || b.title;
        switch (b.type) {
          case "hero": return <HeroBlock key={b.id} slides={slides} products={all} />;
          case "categories": return <CategoriesBlock key={b.id} c={c} categories={categories} products={all} />;
          case "concerns": return <ConcernsBlock key={b.id} c={c} concerns={concerns} products={all} />;
          case "products": return <ProductsBlock key={b.id} c={c} products={productsFor(c)} categories={categories} tags={tags} />;
          case "routine": return <RoutineBlock key={b.id} c={c} products={all} concerns={concerns} categories={categories} tags={tags} />;
          case "editorial": return <EditorialBlock key={b.id} c={c} products={all} />;
          case "promos": return <PromosBlock key={b.id} c={c} products={all} />;
          case "why": return <WhyBlock key={b.id} c={c} />;
          case "testimonials": return <TestimonialsBlock key={b.id} c={c} reviews={reviews} />;
          case "newsletter": return <NewsletterBlock key={b.id} c={c} />;
          default: return null;
        }
      })}
    </>
  );
}
