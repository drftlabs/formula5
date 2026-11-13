// Small presentational pieces shared by the admin pages (server-safe: no hooks).
import Link from "next/link";
import { inr, STATUS } from "@/lib/format";
import { payInfo, stageLabel, STAGE_TONE, phoneIntl } from "@/lib/orderMeta";
import { PRESETS, delta, rangeLabel, fmtDur } from "@/lib/stats";

export const TONE = { ok: ["#143222", "#7fe0a0"], warn: ["#3a2f16", "#ffd08a"], bad: ["#3d1b1d", "#ff9a9a"], cod: ["#3a2f16", "#ffd08a"], info: ["#1a2a3d", "#9cc7ff"], new: ["#2a2a2f", "#f1efe9"], mut: ["#26262a", "#9a9aa0"] };
export const Pill = ({ tone = "new", children, title }) => <span className="pill" title={title} style={{ background: TONE[tone][0], color: TONE[tone][1] }}>{children}</span>;

export function PayBadge({ o }) {
  const p = payInfo(o);
  return <><Pill tone={p.tone}>{p.label}</Pill>{p.sub && <div className="mut" style={{ fontSize: 11, marginTop: 4 }}>{p.sub}</div>}</>;
}
export const StageBadge = ({ o }) => <Pill tone={STAGE_TONE[o.status] || "new"}>{stageLabel(o)}</Pill>;

/** "Repeat #2" flag; red when the repeat came within 24 hours (likely a duplicate or an impatient re-order). */
export function RepeatBadge({ r }) {
  if (!r || r.prev < 1) return null;
  const quick = r.gapH != null && r.gapH < 24;
  const when = r.gapH == null ? "" : r.gapH < 1 ? "under 1 hour after the previous order" : r.gapH < 48 ? `${Math.round(r.gapH)} hours after the previous order` : `${Math.round(r.gapH / 24)} days after the previous order`;
  return <Pill tone={quick ? "bad" : "info"} title={`This customer's order #${r.n} (${when})`}>↻ Repeat #{r.n}{quick ? " · < 24h" : ""}</Pill>;
}

/** Call / WhatsApp / Email buttons. */
export function ContactBtns({ phone, email, name, msg, size = "sm" }) {
  const p = phoneIntl(phone), text = msg || `Hi ${String(name || "").split(" ")[0] || "there"}, this is Taeken. `;
  return (
    <span className="bar-actions" style={{ margin: 0, gap: 6 }}>
      {p && <a className={"abtn ghost " + size} href={`tel:+${p}`}>📞 Call</a>}
      {p && <a className={"abtn ghost " + size} href={`https://wa.me/${p}?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener">💬 WhatsApp</a>}
      {email && <a className={"abtn ghost " + size} href={`mailto:${email}`}>✉ Email</a>}
    </span>
  );
}

export function Delta({ cur, prev, invert }) {
  const d = delta(cur, prev);
  if (!d) return null;
  const good = invert ? d.d < 0 : d.d > 0;
  return <em className={"dl " + (d.d === 0 ? "" : good ? "up" : "down")}>{d.d > 0 ? "▲" : d.d < 0 ? "▼" : ""} {d.t}</em>;
}
export function Kpi({ label, value, cur, prev, sub, href, invert }) {
  const inner = <><span>{label}</span><b>{value}</b><small>{prev != null && <Delta cur={cur} prev={prev} invert={invert} />}{sub && <span className="mut"> {sub}</span>}</small></>;
  return href ? <Link href={href} className="kpi">{inner}</Link> : <div className="kpi">{inner}</div>;
}

/** Date range + comparison controls. Plain GET form (works without JavaScript). */
export function RangeBar({ r, path, extra = {} }) {
  const qs = (o) => "?" + new URLSearchParams({ ...extra, compare: r.compare === "custom" ? "prev" : r.compare, ...o }).toString();
  return (
    <form method="get" action={path} className="rangebar">
      <div className="presets">{PRESETS.map(([k, l]) => <Link key={k} href={qs({ range: k })} className={r.preset === k ? "on" : ""}>{l}</Link>)}</div>
      <div className="rb-custom">
        <input type="hidden" name="range" value="custom" />
        {Object.entries(extra).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
        <label>From<input type="date" name="from" defaultValue={r.from} max={r.today} /></label>
        <label>To<input type="date" name="to" defaultValue={r.to} max={r.today} /></label>
        <label>Compare with
          <select name="compare" defaultValue={r.compare}><option value="prev">Previous period</option><option value="none">No comparison</option><option value="custom">Custom dates…</option></select>
        </label>
        <label>Compare from<input type="date" name="cfrom" defaultValue={r.cmp?.from || ""} /></label>
        <label>to<input type="date" name="cto" defaultValue={r.cmp?.to || ""} /></label>
        <button className="abtn sm">Apply</button>
      </div>
      <p className="mut" style={{ fontSize: 12, margin: "8px 0 0" }}>Showing <b style={{ color: "#f1efe9" }}>{rangeLabel(r)}</b>{r.cmp && <> · compared with {rangeLabel(r.cmp)}</>} · Indian time</p>
    </form>
  );
}

/** Sales bars (+ dashed comparison line). Pure SVG, no JavaScript. */
export function SalesChart({ data, cmp, h = 240 }) {
  const W = 860, pl = 54, pr = 10, pt = 14, pb = 28, iw = W - pl - pr, ih = h - pt - pb;
  const max = Math.max(1, ...data.map((d) => d.sales), ...(cmp || []).map((d) => d.sales));
  const mag = 10 ** Math.floor(Math.log10(max)), top = Math.ceil(max / mag * 2) / 2 * mag || 1;    // nice ceiling
  const n = data.length, bw = iw / n, y = (v) => pt + ih - (v / top) * ih, x = (i) => pl + bw * i + bw / 2;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => top * t), step = Math.ceil(n / 10);
  const short = (v) => (v >= 1e5 ? `${+(v / 1e5).toFixed(1)}L` : v >= 1e3 ? `${+(v / 1e3).toFixed(1)}k` : v);
  const line = cmp?.length ? cmp.slice(0, n).map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.sales).toFixed(1)}`).join("") : "";
  return (
    <svg viewBox={`0 0 ${W} ${h}`} className="chart" role="img" aria-label="Sales chart">
      {ticks.map((t) => <g key={t}><line x1={pl} x2={W - pr} y1={y(t)} y2={y(t)} stroke="#2a2a2e" /><text x={pl - 8} y={y(t) + 4} textAnchor="end" className="ax">₹{short(Math.round(t))}</text></g>)}
      {data.map((d, i) => <g key={d.key}>
        <rect x={x(i) - Math.min(bw * 0.7, 40) / 2} y={y(d.sales)} width={Math.min(bw * 0.7, 40)} height={Math.max(0, pt + ih - y(d.sales))} fill="#d7262b" opacity="0.92"><title>{`${d.label}: ${inr(d.sales)} · ${d.orders} order${d.orders === 1 ? "" : "s"}${cmp?.[i] ? `\nCompared: ${cmp[i].label} ${inr(cmp[i].sales)}` : ""}`}</title></rect>
        {i % step === 0 && <text x={x(i)} y={h - 8} textAnchor="middle" className="ax">{d.label}</text>}
      </g>)}
      {line && <path d={line} fill="none" stroke="#9a9aa0" strokeWidth="2" strokeDasharray="5 4" />}
      {cmp?.slice(0, n).map((d, i) => <circle key={i} cx={x(i)} cy={y(d.sales)} r="3" fill="#9a9aa0"><title>{`${d.label}: ${inr(d.sales)}`}</title></circle>)}
    </svg>
  );
}

/** Horizontal bar list. items: [label, value, sublabel?] */
export function BarList({ items, fmt = (v) => v, empty = "No data yet." }) {
  const max = Math.max(1, ...items.map((i) => i[1]));
  if (!items.length) return <p className="mut" style={{ margin: 0 }}>{empty}</p>;
  return <div className="ap-bl">{items.map(([l, v, s]) => <div key={l} className="ap-bl-r"><div className="ap-bl-t"><span>{l}</span><b>{fmt(v)}{s ? <small className="mut"> {s}</small> : null}</b></div><div className="ap-bl-b"><i style={{ width: `${Math.max(2, (v / max) * 100)}%` }} /></div></div>)}</div>;
}
export function ColBars({ values, labels }) {
  const max = Math.max(1, ...values);
  return <div className="cb">{values.map((v, i) => <div key={i} className="cb-c" title={`${labels[i]}: ${v}`}><i style={{ height: `${v ? Math.max(4, (v / max) * 100) : 0}%` }} /><span>{i % 3 === 0 ? labels[i] : ""}</span></div>)}</div>;
}
export function Funnel({ steps }) {
  const top = Math.max(1, steps[0].v);
  return <div className="fn">{steps.map((s, i) => <div key={s.l} className="fn-r">
    <div className="fn-l"><span>{s.l}</span><b>{s.v.toLocaleString("en-IN")}</b></div>
    <div className="fn-b"><i style={{ width: `${Math.max(1.5, Math.min(100, (s.v / top) * 100))}%` }} /></div>
    <small className="mut">{i === 0 ? "of all visits" : `${Math.min(100, s.p)}% of ${steps[i - 1].l.toLowerCase()}`}{i > 0 && ` · ${top ? Math.round((s.v / top) * 1000) / 10 : 0}% of visits`}</small>
  </div>)}</div>;
}
export { fmtDur };
