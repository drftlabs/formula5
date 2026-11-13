"use client";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { bulkProducts } from "@/lib/actions/admin";
import { inr } from "@/lib/format";

const stockOf = (p) => Object.values(p.sizes || {}).reduce((t, n) => t + Number(n), 0);

export default function ProductTable({ products, collections, tags }) {
  const [sel, setSel] = useState([]), [q, setQ] = useState(""), [f, setF] = useState("all"), [col, setCol] = useState("");
  const [act, setAct] = useState(""), [val, setVal] = useState(""), [msg, setMsg] = useState(null), [pending, start] = useTransition(), router = useRouter();
  const cn = Object.fromEntries(collections.map((c) => [c.id, c.name])), tm = Object.fromEntries(tags.map((t) => [t.slug, t]));
  const list = useMemo(() => products.filter((p) => {
    if (q && !(p.name + " " + (p.sku || "")).toLowerCase().includes(q.toLowerCase())) return false;
    if (col && !(p.collection_ids?.includes(col) || p.collection_id === col)) return false;
    const s = stockOf(p);
    if (f === "live") return p.active; if (f === "hidden") return !p.active;
    if (f === "low") return s > 0 && s <= (p.low_stock ?? 3) * Object.keys(p.sizes || {}).length / 2 + 2; if (f === "out") return s === 0;
    return true;
  }), [products, q, f, col]);
  const all = list.length > 0 && list.every((p) => sel.includes(p.id));
  const toggle = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const needsVal = ["add_collection", "remove_collection", "add_tag", "remove_tag", "set_price_pct"].includes(act);
  const run = () => {
    if (!act) return setMsg({ err: "Choose an action" });
    if (needsVal && !val) return setMsg({ err: "Choose a value" });
    if (act === "delete" && !confirm(`Delete ${sel.length} product(s) permanently?`)) return;
    start(async () => { const r = await bulkProducts(sel, act, val); if (r.error) setMsg({ err: r.error }); else { setMsg({ ok: "Done" }); setSel([]); setAct(""); setVal(""); router.refresh(); } });
  };
  return (
    <>
      <div className="bar-actions">
        <input className="in" style={{ width: 240 }} placeholder="Search name or SKU" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="in" style={{ width: 150 }} value={f} onChange={(e) => setF(e.target.value)}><option value="all">All status</option><option value="live">Live</option><option value="hidden">Hidden / draft</option><option value="low">Low stock</option><option value="out">Out of stock</option></select>
        <select className="in" style={{ width: 180 }} value={col} onChange={(e) => setCol(e.target.value)}><option value="">All collections</option>{collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <span className="mut" style={{ fontSize: 12 }}>{list.length} of {products.length}</span>
      </div>
      {sel.length > 0 && (
        <div className="bulkbar">
          <b>{sel.length} selected</b>
          <select className="in" value={act} onChange={(e) => { setAct(e.target.value); setVal(""); }}>
            <option value="">Bulk action…</option><option value="live">Make live</option><option value="hide">Hide (draft)</option>
            <option value="add_collection">Add to collection…</option><option value="remove_collection">Remove from collection…</option>
            <option value="add_tag">Add tag…</option><option value="remove_tag">Remove tag…</option><option value="set_price_pct">Change price by %…</option><option value="delete">Delete</option>
          </select>
          {act.endsWith("collection") && <select className="in" value={val} onChange={(e) => setVal(e.target.value)}><option value="">Pick collection</option>{collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>}
          {act.endsWith("_tag") && <select className="in" value={val} onChange={(e) => setVal(e.target.value)}><option value="">Pick tag</option>{tags.map((t) => <option key={t.slug} value={t.slug}>{t.name}</option>)}</select>}
          {act === "set_price_pct" && <input className="in" style={{ width: 120 }} type="number" placeholder="e.g. -10 or 15" value={val} onChange={(e) => setVal(e.target.value)} />}
          <button className="abtn sm" disabled={pending} onClick={run}>{pending ? "Working…" : "Apply"}</button>
          <button className="abtn sm ghost" onClick={() => setSel([])}>Clear</button>
          {msg && <span className={"flash" + (msg.err ? " err" : "")} style={{ margin: 0 }}>{msg.err || msg.ok}</span>}
        </div>
      )}
      <div className="tblwrap"><table className="tbl"><thead><tr><th><input type="checkbox" aria-label="Select all" checked={all} onChange={() => setSel(all ? [] : list.map((p) => p.id))} /></th><th></th><th>Name</th><th>SKU</th><th>Collections</th><th>Price</th><th>Stock</th><th>Tags</th><th>Status</th></tr></thead><tbody>
        {list.map((p) => { const s = stockOf(p), low = s <= 5; const ids = p.collection_ids?.length ? p.collection_ids : p.collection_id ? [p.collection_id] : []; return (
          <tr key={p.id}><td><input type="checkbox" aria-label={`Select ${p.name}`} checked={sel.includes(p.id)} onChange={() => toggle(p.id)} /></td><td><div className="thumbs-adm">{p.images?.[0] && <img src={p.images[0]} alt="" />}</div></td>
            <td><Link href={`/admin/products/${p.id}`}><b>{p.name}</b></Link>{p.featured && <span className="mut"> ★</span>}</td><td className="mut">{p.sku || "-"}</td><td className="mut">{ids.map((i) => cn[i]).filter(Boolean).join(", ") || "-"}</td><td>{inr(p.price)}</td>
            <td style={s === 0 ? { color: "#A33B34" } : low ? { color: "#ffb86b" } : undefined}>{s === 0 ? "Out" : s}</td>
            <td>{(p.tags || []).map((t) => tm[t] && <span key={t} className="pill" style={{ background: tm[t].bg, color: tm[t].fg, marginRight: 4 }}>{tm[t].name}</span>)}</td><td>{p.active ? "Live" : <span className="mut">Hidden</span>}</td></tr>); })}
        {!list.length && <tr><td colSpan="9" className="mut">No products match.</td></tr>}
      </tbody></table></div>
    </>
  );
}
