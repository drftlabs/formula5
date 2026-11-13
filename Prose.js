// Tiny renderer for policy text: "## Heading", "- bullet", blank-line paragraphs, **bold**.
const inline = (t) => t.split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : p));
export default function Prose({ text }) {
  const out = []; let list = [], para = [], imgs = [];
  const flushP = () => { if (para.length) { out.push(<p key={out.length}>{para.map((l, i) => <span key={i}>{inline(l)}{i < para.length - 1 && <br />}</span>)}</p>); para = []; } };
  const flushI = () => { if (!imgs.length) return; const f = (m, k) => <figure key={k}><img src={m[2]} alt={m[1]} loading="lazy" decoding="async" /></figure>; out.push(imgs.length === 1 ? f(imgs[0], out.length) : <div className="fig-row" key={out.length} style={{ "--n": Math.min(imgs.length, 3) }}>{imgs.map((m, k) => f(m, k))}</div>); imgs = []; };
  const flushL = () => { if (list.length) { out.push(<ul key={out.length}>{list.map((l, i) => <li key={i}>{inline(l)}</li>)}</ul>); list = []; } };
  for (const raw of String(text).split("\n")) {
    const l = raw.trim();
    if (!l) { flushP(); flushL(); }
    else if (/^!\[[^\]]*\]\((https?:\/\/|\/)[^)\s]+\)$/.test(l)) { flushP(); flushL(); imgs.push(l.match(/^!\[([^\]]*)\]\(([^)\s]+)\)$/)); }
    else if (l.startsWith("## ")) { flushI(); flushP(); flushL(); out.push(<h2 key={out.length}>{l.slice(3)}</h2>); }
    else if (l.startsWith("- ")) { flushI(); flushP(); list.push(l.slice(2)); }
    else if (/^\d+\.\s/.test(l)) { flushI(); flushP(); list.push(l.replace(/^\d+\.\s/, "")); }
    else { flushI(); flushL(); para.push(l); }
  }
  flushI(); flushP(); flushL();
  return <div className="prose">{out}</div>;
}
