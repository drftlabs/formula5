import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getProducts, getCategories, getConcerns, getTags, getSettings, packsOf, getProductReviews } from "@/lib/data";
import Reviews from "@/components/Reviews";
import PdpGallery from "@/components/PdpGallery";
import PdpBuy from "@/components/PdpBuy";
import ProductRow from "@/components/ProductRow";
import PinCheck from "@/components/PinCheck";
import Reveal from "@/components/Reveal";
import PixelEvent from "@/components/PixelEvent";
import RecentlyViewed from "@/components/RecentlyViewed";
import { shippingCfg } from "@/lib/pricing";
import { opt, srcSet } from "@/lib/img";
import { inr, SITE_URL, splitName, activeLabel } from "@/lib/format";

export const dynamic = "force-dynamic";
const ok = (s) => s && !/to be confirmed/i.test(s);

export async function generateMetadata({ params }) {
  const p = await getProductBySlug(params.slug);
  if (!p) return { title: "Not found" };
  return { title: p.seo_title || p.name, description: p.seo_description || p.description || p.usp, openGraph: p.images?.[0] ? { images: [p.images[0]] } : undefined };
}

export default async function ProductPage({ params }) {
  const p = await getProductBySlug(params.slug);
  if (!p) notFound();
  const [cats, concerns, tags, settings, rv] = await Promise.all([getCategories(), getConcerns(), getTags(), getSettings(), getProductReviews(params.slug)]);
  const cat = cats.find((c) => c.slug === p.category), catMap = Object.fromEntries(cats.map((c) => [c.slug, c])), tagMap = Object.fromEntries(tags.map((t) => [t.slug, t]));
  const mine = concerns.filter((c) => (p.concerns || []).includes(c.slug));
  const packs = packsOf(p), cfg = shippingCfg(settings);
  const { short, amount, inci } = splitName(p.name);
  const sold = Object.values(p.sizes || {}).every((n) => Number(n) <= 0);
  let related = (await getProducts({ category: p.category, excludeId: p.id })).slice(0, 8);
  if (related.length < 4) { const more = await getProducts({ excludeId: p.id }); related = [...related, ...more.filter((m) => !related.some((r) => r.id === m.id))].slice(0, 8); }
  const acc = p.accent || cat?.accent || "#B7B7AE";
  const ingredients = ok(p.ingredients_raw) ? p.ingredients_raw : amount ? `${amount} ${inci}` : "";
  const ld = { "@context": "https://schema.org", "@type": "Product", name: p.name, image: p.images, description: p.description || p.usp, brand: { "@type": "Brand", name: "Formula 5" }, offers: { "@type": "Offer", priceCurrency: "INR", price: packs[0].price, availability: sold ? "https://schema.org/OutOfStock" : "https://schema.org/InStock", url: `${SITE_URL}/products/${p.slug}` } };
  const tagline = p.tagline || p.usp;
  const extra = (Array.isArray(p.extra_images) ? p.extra_images : []).filter(Boolean);
  const notes = (p.ingredient_notes || []).filter(Boolean).map((n) => String(n).split(":")[0].trim());
  const top = (Array.isArray(p.top_ingredients) && p.top_ingredients.length ? p.top_ingredients : notes.length ? notes : amount ? [`${amount} ${activeLabel(inci)}`] : []).slice(0, 5);
  const firstSentence = (t) => String(t || "").split(/(?<=[.!?])\s/)[0];
  const five = (Array.isArray(p.formula5) && p.formula5.length ? p.formula5 : [
    { title: "Hero active", text: amount ? `${amount} ${activeLabel(inci)}` : "" },
    { title: "What it does", text: firstSentence(p.description) },
    { title: "Top ingredients", text: top.slice(0, 3).join(", ") },
    { title: "How to use", text: firstSentence(p.how_to_use) },
    { title: "Good for", text: mine.map((c) => c.name).join(", ") || cat?.name || "" },
  ]).filter((x) => ok(x.text)).slice(0, 5);
  const rows = [
    ["Description", p.description], ["Benefits", p.benefits], ["Ingredients", ingredients], ["How to use", p.how_to_use], ["Who it's for", p.ideal_customer],
  ].filter(([, v]) => ok(v));
  return (
    <div className="pd" style={{ "--acc": acc }}>
      <PixelEvent event="ViewContent" data={{ content_ids: [p.id], content_name: p.name, content_type: "product", value: packs[0].price, currency: "INR" }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <div className="f5-wrap pd-pad">
        <div className="pd-grid">
          <div className="pd-media">{(p.tagObjs || []).length > 0 && <div className="pd-tags">{p.tagObjs.map((t) => <span key={t.slug} style={{ background: t.bg || undefined, color: t.fg || undefined }}>{t.name}</span>)}</div>}<PdpGallery images={p.images || []} product={p} /></div>
          <div className="pd-info">
            {cat && <p className="f5-eyebrow">{cat.name}</p>}
            <h1 className="pd-name">{short}</h1>
            {amount && <p className="pd-active"><b>{amount}</b> {activeLabel(inci)}</p>}
            <PdpBuy p={p} packs={packs} sold={sold} tagline={tagline} top={top} rating={{ avg: rv.avg, count: rv.count }} />
            <PinCheck days={settings.delivery_days} cod={cfg.codEnabled} etaMin={cfg.etaMin} etaMax={cfg.etaMax} />
            {mine.length > 0 && <div className="pd-con"><span>Good for</span>{mine.map((c) => <Link key={c.slug} href={`/products?concern=${c.slug}`}>{c.name}</Link>)}</div>}
          </div>
        </div>
      </div>
      {(five.length > 0 || extra.length > 0) && <section className={"pd-f5x" + (extra.length ? " has-x" : "")} aria-label="Five things to know">
        {extra.length > 0 && <div className="pd-x">{extra.map((src, n) => <img key={n} src={opt(src, 1080)} srcSet={srcSet(src, [640, 828, 1080, 1200])} sizes="(max-width:900px) 100vw, 46vw" alt="" loading="lazy" decoding="async" />)}</div>}
        {five.length > 0 && <div className="pd-f5-in"><h2 className="pd-f5-h">Five things to <em>know.</em></h2><ol className="pd-five">{five.map((x, n) => <li key={n}><span>0{n + 1}</span><div><h3>{x.title}</h3><p>{x.text}</p></div></li>)}</ol></div>}
      </section>}
      {ok(p.description) && <section className="pd-desc"><div className="f5-wrap pd-pad"><p>{p.description}</p></div></section>}
      {rv.count > 0 && <Reviews data={rv} name={short} />}
      <RecentlyViewed slug={p.slug} />
      {related.length > 0 && <Reveal as="section" className="f5-sec f5-band-warm"><div className="f5-wrap"><div className="f5-head"><div><p className="f5-eyebrow">Pairs well</p><h2 className="f5-h2">You may <em>also like</em></h2></div></div><ProductRow products={related} catMap={catMap} tagMap={tagMap} label="Related products" /></div></Reveal>}
    </div>
  );
}
