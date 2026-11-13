import { inr } from "@/lib/format";
function Set({ items, hidden }) {
  return (
    <div className="f5-tick-set" aria-hidden={hidden || undefined}>
      {[0, 1, 2].map((n) => items.map((t, i) => <span key={`${n}-${i}`} style={{ display: "contents" }}><span>{t}</span><i /></span>))}
    </div>
  );
}
// Announcement bar. Edit the lines in Admin → Settings.
export default function Ticker({ items, freeMin }) {
  let list = items?.length ? items : ["Precision. Purity. Performance."];
  // a free-shipping line always follows the Settings value so it can never be out of date
  if (Number(freeMin) > 0) list = list.map((t) => (/free shipping/i.test(t) ? t.replace(/₹\s?[\d,]+/, inr(freeMin)) : t));
  return <div className="f5-tick" aria-label="Announcements"><div className="f5-tick-track"><Set items={list} /><Set items={list} hidden /></div></div>;
}
