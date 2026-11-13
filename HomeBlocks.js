import Link from "next/link";
import Hero from "./Hero";
import ProductRow from "./ProductRow";
import Bottle from "./Bottle";
import Reveal from "./Reveal";
import Newsletter from "./Newsletter";
import RoutineBlock from "./RoutineBlock";
import Art, { Shot } from "./Art";
import { Media, SmartLink, Arrow } from "./Media";

// "Line one|Line two": the last line is set bold, the way the logo's "5" is.
function Head({ t }) {
  const parts = String(t || "").split("|");
  return <>{parts.map((l, i) => (i === parts.length - 1 && parts.length > 1 ? <em key={i}>{l}</em> : <span key={i}>{l}</span>))}</>;
}
const Go = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
function SecHead({ c, link, linkText }) {
  return (
    <div className="f5-head">
      <div>{c.eyebrow && <p className="f5-eyebrow">{c.eyebrow}</p>}<h2 className="f5-h2"><Head t={c.title} /></h2></div>
      {link && <SmartLink className="f5-link" href={link}>{linkText || "View all"}<Go /></SmartLink>}
    </div>
  );
}

export { RoutineBlock };
export const HeroBlock = ({ slides, products }) => <Hero slides={slides} products={products} />;

export function CategoriesBlock({ c, categories, products }) {
  return (
    <section className="f5-sec" id="categories" aria-label={c.title}>
      <div className="f5-wrap">
        <SecHead c={c} />
        <div className="f5-scroll f5-cats">
          {categories.map((cat) => {
            const inCat = products.filter((p) => p.category === cat.slug);
            return (
              <Link key={cat.id} className="f5-cat" href={`/categories/${cat.slug}`} style={{ "--acc": cat.accent }} aria-label={`${cat.name}, ${inCat.length} products`}>
                {cat.image ? <Media src={cat.image} alt="" /> : inCat[0] && <div className="f5-cat-art"><Shot p={inCat[0]} scale={1} /></div>}
                <div className="f5-cat-meta"><div><h3>{cat.name}</h3><small>{inCat.length} {inCat.length === 1 ? "product" : "products"}</small></div><span className="f5-cat-go"><Go /></span></div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const ICON = {
  hair: <path d="M8 3.5c-2 5 2 8 0 17M12 3.5c-2 5 2 8 0 17M16 3.5c-2 5 2 8 0 17" />,
  glow: <><circle cx="12" cy="12" r="3.2" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.8" /></>,
  drop: <path d="M12 3.5s6 6.2 6 10.3a6 6 0 0 1-12 0C6 9.7 12 3.5 12 3.5Z" />,
  bolt: <path d="M13 3 5.5 13.5H12L11 21l7.5-10.5H12L13 3Z" />,
  wave: <path d="M3 9c3-3 6 3 9 0s6 3 9 0M3 15c3-3 6 3 9 0s6 3 9 0" />,
};
export function ConcernsBlock({ c, concerns, products }) {
  return (
    <section className="f5-sec" id="concerns" aria-label={c.title} style={{ paddingTop: 0 }}>
      <div className="f5-wrap">
        <SecHead c={c} />
        <div className="f5-concerns">
          {concerns.map((x) => {
            const n = products.filter((p) => (p.concerns || []).includes(x.slug)).length;
            return (
              <Link key={x.id} className="f5-con" href={`/concerns/${x.slug}`} style={{ "--acc": x.accent }}>
                <span className="f5-con-ic">{x.image ? <img src={x.image} alt="" width="24" height="24" /> : <svg viewBox="0 0 24 24" aria-hidden="true">{ICON[x.icon] || ICON.drop}</svg>}</span>
                <span><b>{x.name}</b><small>{n} {n === 1 ? "product" : "products"}</small></span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function ProductsBlock({ c, products, categories, tags }) {
  if (!products.length) return null;
  const catMap = Object.fromEntries(categories.map((x) => [x.slug, x]));
  const tagMap = Object.fromEntries(tags.map((x) => [x.slug, x]));
  return (
    <section className="f5-sec" aria-label={c.title} style={{ paddingTop: 0 }}>
      <div className="f5-wrap">
        <SecHead c={c} link={c.link} linkText={c.link_text} />
        <ProductRow products={products} catMap={catMap} tagMap={tagMap} label={c.title} />
      </div>
    </section>
  );
}

export function EditorialBlock({ c, products }) {
  const items = String(c.art || "").split(",").filter(Boolean).map((k) => products.find((p) => p.slug.startsWith(k.trim()))).filter(Boolean);
  return (
    <section className="f5-sec f5-editorial" aria-label={c.title}>
      <div className="f5-wrap f5-ed">
        <Reveal className="f5-ed-img" style={{ "--acc": c.accent || "#A9C2A2" }}>{c.image ? <Media src={c.image} alt="" /> : <Art items={items} />}</Reveal>
        <Reveal className="f5-ed-copy" delay={100}>
          <p className="f5-eyebrow">{c.eyebrow}</p><h2 className="f5-h2"><Head t={c.title} /></h2><p className="f5-lede">{c.text}</p>
          <ul className="f5-pills"><li>Precision</li><li>Purity</li><li>Performance</li></ul>
          {c.cta_text && <SmartLink className="btn" href={c.link}>{c.cta_text}<Go /></SmartLink>}
        </Reveal>
      </div>
    </section>
  );
}

export function PromosBlock({ c, products = [] }) {
  const items = (c.items || []).filter((x) => x.title);
  if (!items.length) return null;
  return (
    <section className="f5-sec" aria-label="Offers" style={{ paddingTop: "clamp(52px,8vw,112px)" }}>
      <div className="f5-wrap f5-promos">
        {items.map((x, i) => (
          <Reveal key={i} delay={i * 80} className="f5-promo" style={{ "--acc": x.accent || "#B7B7AE" }}>
            {x.image ? <Media src={x.image} mobile={x.image_mobile} alt="" /> : (() => { const p = products.find((q) => q.slug.startsWith(x.art || "~")); return p ? <div className="f5-promo-art"><Art items={[p]} /></div> : null; })()}
            <h3>{x.title}</h3>{x.text && <p>{x.text}</p>}
            {x.cta_text && <SmartLink className="f5-link" href={x.link}>{x.cta_text}<Go /></SmartLink>}
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const WHY = [
  { i: <><circle cx="12" cy="12" r="6.5" /><path d="M12 2.5v5M12 16.5v5M2.5 12h5M16.5 12h5" /></>, t: "Precision", d: "Every formula is built around one hero active, with its percentage stated up front." },
  { i: <path d="M12 3.5s6 6.2 6 10.3a6 6 0 0 1-12 0C6 9.7 12 3.5 12 3.5Z" />, t: "Purity", d: "Clear ingredient information and clean presentation. No unnecessary complexity." },
  { i: <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />, t: "Performance", d: "Products designed to perform, not merely promise." },
  { i: <><circle cx="12" cy="12" r="9" /><path d="M8 12.5l2.7 2.7L16 9.5" /></>, t: "Plain claims", d: "Cosmetic-appropriate language only. No miracle promises." },
];
export function WhyBlock({ c }) {
  return (
    <section className="f5-sec f5-band-stone" aria-label={c.title}>
      <div className="f5-wrap">
        <SecHead c={c} />
        <ul className="f5-why">
          {WHY.map((x, n) => (
            <Reveal as="li" key={x.t} delay={n * 70}>
              <span className="f5-why-n">0{n + 1}</span>
              <div><svg viewBox="0 0 24 24" aria-hidden="true">{x.i}</svg><h3>{x.t}</h3><p>{x.d}</p></div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

import { Star } from "./Star";
export function TestimonialsBlock({ c, reviews }) {
  if (!reviews?.length) return null;
  return (
    <section className="f5-sec f5-reviews" aria-label={c.title} style={{ paddingTop: 0 }}>
      <div className="f5-wrap">
        <SecHead c={c} />
        <div className="f5-scroll">
          {reviews.map((r) => (
            <article key={r.id} className="f5-rev">
                            <div className="f5-stars" role="img" aria-label={`${r.rating} out of 5`}>{[1, 2, 3, 4, 5].map((k) => <Star key={k} off={k > r.rating} />)}</div>
              <h3>{r.title}</h3><p>{r.body}</p>
              <div className="who"><b>{r.name}</b>{r.product_name ? ` · ${r.product_name.replace(/\s+\d.*$/, "")}` : ""}</div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export const NewsletterBlock = ({ c }) => (
  <section className="f5-sec f5-news" aria-label="Newsletter">
    <div className="f5-wrap"><p className="f5-eyebrow">{c.eyebrow}</p><h2 className="f5-h2">{c.title}</h2>{c.text && <p className="lead">{c.text}</p>}<Newsletter /></div>
  </section>
);
