import { Star } from "./Star";
const fmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "";
export default function ReviewCard({ r }) {
  return (
    <article className="rv-card">
      <div className="f5-stars" role="img" aria-label={`${r.rating} out of 5`}>{[1, 2, 3, 4, 5].map((k) => <Star key={k} off={k > r.rating} />)}</div>
      <h3>{r.title}</h3><p>{r.body}</p>
      <div className="who"><b>{r.name}</b>{r.date ? ` · ${fmt(r.date)}` : ""}</div>
      {r.reply && <div className="rv-reply"><b>Formula 5</b><p>{r.reply}</p></div>}
    </article>
  );
}
