import { Star } from "./Star";
const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "";
// All reviews for one product: average on the left, the list on the right. First six show, the rest open with one tap.
export default function Reviews({ data, name }) {
  const { list, count, avg } = data;
  const dist = [5, 4, 3, 2, 1].map((n) => [n, list.filter((r) => r.rating === n).length]);
  const Card = ({ r }) => (
    <article className="rv-card">
      <div className="f5-stars" role="img" aria-label={`${r.rating} out of 5`}>{[1, 2, 3, 4, 5].map((k) => <Star key={k} off={k > r.rating} />)}</div>
      <h3>{r.title}</h3><p>{r.body}</p>
      <div className="who"><b>{r.name}</b>{r.date ? ` · ${fmt(r.date)}` : ""}</div>
      {r.reply && <div className="rv-reply"><b>Formula 5</b><p>{r.reply}</p></div>}
    </article>
  );
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
            {list.slice(0, 6).map((r) => <Card key={r.id} r={r} />)}
            {list.length > 6 && <details className="rv-more"><summary>Show all {count} reviews</summary><div className="rv-list in">{list.slice(6).map((r) => <Card key={r.id} r={r} />)}</div></details>}
          </div>
        </div>
      </div>
    </section>
  );
}
