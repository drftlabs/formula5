import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug, getProductReviews } from "@/lib/data";
import ReviewCard from "@/components/ReviewCard";
import { Stars } from "@/components/Star";

export const dynamic = "force-dynamic";
const PER = 10;
export async function generateMetadata({ params }) {
  const p = await getProductBySlug(params.slug);
  return p ? { title: `Reviews: ${p.name}`, description: `Customer reviews for ${p.name}.` } : {};
}

// Every review for one product, 10 per page. ?sort=top (default) | new
export default async function ReviewsPage({ params, searchParams }) {
  const p = await getProductBySlug(params.slug);
  if (!p) notFound();
  const rv = await getProductReviews(params.slug);
  if (!rv.count) notFound();
  const sort = searchParams?.sort === "new" ? "new" : "top";
  const list = [...rv.list].sort(sort === "new" ? (a, b) => String(b.date || "").localeCompare(String(a.date || "")) : (a, b) => b.rating - a.rating || (b.body || "").length - (a.body || "").length);
  const pages = Math.max(1, Math.ceil(list.length / PER)), page = Math.min(pages, Math.max(1, Number(searchParams?.page) || 1));
  const q = (pg, s = sort) => `/products/${p.slug}/reviews?${new URLSearchParams({ ...(s === "new" ? { sort: "new" } : {}), ...(pg > 1 ? { page: pg } : {}) })}`.replace(/\?$/, "");
  return (
    <section className="f5-sec pd-rv rv-page">
      <div className="f5-wrap">
        <Link className="rv-back" href={`/products/${p.slug}#reviews`}>&larr; Back to product</Link>
        <div className="f5-head"><div><p className="f5-eyebrow">Reviews</p><h1 className="f5-h2">{p.name}</h1></div></div>
        <div className="rv-top"><b>{rv.avg.toFixed(1)}</b><Stars value={rv.avg} /><span>{rv.count} review{rv.count === 1 ? "" : "s"}</span>
          <nav className="rv-sort" aria-label="Sort reviews"><Link className={sort === "top" ? "on" : ""} href={q(1, "top")}>Top rated</Link><Link className={sort === "new" ? "on" : ""} href={q(1, "new")}>Newest</Link></nav></div>
        <div className="rv-list">{list.slice((page - 1) * PER, page * PER).map((r) => <ReviewCard key={r.id} r={r} />)}</div>
        {pages > 1 && <nav className="rv-pager" aria-label="Review pages">
          {page > 1 ? <Link href={q(page - 1)}>&larr; Previous</Link> : <span />}
          <em>Page {page} of {pages}</em>
          {page < pages ? <Link href={q(page + 1)}>Next page &rarr;</Link> : <span />}
        </nav>}
      </div>
    </section>
  );
}
