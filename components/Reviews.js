import Link from "next/link";
import ReviewCard from "./ReviewCard";
import { Star } from "./Star";
// d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "";
// All reviews for one product: average on the left, the list on the right. The three top-rated reviews show here; the rest are on their own page.
export default function Reviews({ data, name, slug, top = [] }) {
  const { list, count, avg } = data;
  const dist = [5, 4, 3, 2, 1].map((n) => [n, list.filter((r) => r.rating === n).length]);
  return (
    <section className="f5-sec pd-rv" aria-label={`Reviews for ${name}`} id="reviews">
      <div className="f5-wrap">
        <div className="f5-head"><div><p className="f5-eyebrow">Reviews</p><h2 className="f5-h2">What people <em>say.</em></h2></div></div>
        <div className="rv-grid">
          <div className="rv-sum">
            <div className="rv-avg"><b>{avg.toFixed(1)}</b><span>out of 5</span></div>
            <div className="f5-stars" role="img" aria-label={`${avg} out of 5`}>{[1, 2, 3, 4, 5].map((k) => <Star key={k} off={k > Math.round(avg)} />)}</div>
            <p>{count} review{count === 1 ? "" : "s"}</p>
            <ul>{dist.map(([n, c]) => <li key={n}><span>{n}</span><i><u style={{ width: (count ? (c / count) * 100 : 0) + "%" }} /></i><em>{c}</em></li>)}</ul>
          </div>
          <div className="rv-list">
            {top.map((r) => <ReviewCard key={r.id} r={r} />)}
            {count > top.length && <Link className="rv-all" href={`/products/${slug}/reviews`}>See all {count} reviews</Link>}
          </div>
        </div>
      </div>
    </section>
  );
}
