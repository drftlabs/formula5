"use client";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveInventory } from "@/lib/actions/admin";

export default function InventoryTable({ products, sizeKeys }) {
  const [vals, setVals] = useState(() => Object.fromEntries(products.map((p) => [p.id, { ...p.sizes }])));
  const [dirty, setDirty] = useState({}), [q, setQ] = useState(""), [only, setOnly] = useState(false), [msg, setMsg] = useState(null), [pending, start] = useTransition(), router = useRouter();
  const set = (id, s, v) => { setVals((x) => ({ ...x, [id]: { ...x[id], [s]: v } })); setDirty((d) => ({ ...d, [id]: true })); };
  const tot = (id) => Object.values(vals[id] || {}).reduce((t, n) => t + (Number(n) || 0), 0);
  const list = useMemo(() => products.filter((p) => (!q || (p.name + (p.sku || "")).toLowerCase().includes(q.toLowerCase())) && (!only || tot(p.id) <= 5 || sizeKeys.some((s) => Number(vals[p.id]?.[s] || 0) === 0)))
    // eslint-disable-next-line
    , [products, q, only, vals]);
  const n = Object.keys(dirty).length;
  const unitsAll = products.reduce((t, p) => t + tot(p.id), 0);
  return (
    <>
      <div className="cards"><div className="stat"><b>{products.length}</b><span>Products</span></div><div className="stat"><b>{unitsAll}</b><span>Pairs in stock</span></div><div className="stat"><b>{products.filter((p) => tot(p.id) === 0).length}</b><span>Out of stock</span></div></div>
      <div className="bar-actions">
        <input className="in" style={{ width: 240 }} placeholder="Search name or SKU" value={q} onChange={(e) => setQ(e.target.value)} />
        <label className="chk" style={{ margin: 0 }}><input type="checkbox" checked={only} onChange={(e) => setOnly(e.target.checked)} />Only low / sold-out sizes</label>
        <button className="abtn" disabled={!n || pending} onClick={() => start(async () => { const r = await saveInventory(Object.keys(dirty).map((id) => ({ id, sizes: vals[id] }))); if (r.error) setMsg({ err: r.error }); else { setMsg({ ok: `Saved ${n} product(s)` }); setDirty({}); router.refresh(); } })}>{pending ? "Saving…" : n ? `Save ${n} change${n > 1 ? "s" : ""}` : "No changes"}</button>
        {msg && <span className={"flash" + (msg.err ? " err" : "")} style={{ margin: 0 }}>{msg.err || msg.ok}</span>}
      </div>
      <div className="tblwrap"><table className="tbl inv"><thead><tr><th>Product</th>{sizeKeys.map((s) => <th key={s}>UK {s}</th>)}<th>Total</th></tr></thead><tbody>
        {list.map((p) => <tr key={p.id} className={dirty[p.id] ? "dirty" : ""}><td><Link href={`/admin/products/${p.id}`}><b>{p.name}</b></Link><br /><span className="mut">{p.sku || ""}</span></td>
          {sizeKeys.map((s) => { const v = Number(vals[p.id]?.[s] || 0); return <td key={s}><input className={"in qty" + (v === 0 ? " zero" : v <= (p.low_stock ?? 3) ? " low" : "")} type="number" min="0" value={vals[p.id]?.[s] ?? 0} onChange={(e) => set(p.id, s, e.target.value)} aria-label={`${p.name} UK ${s}`} /></td>; })}
          <td><b>{tot(p.id)}</b></td></tr>)}
        {!list.length && <tr><td colSpan={sizeKeys.length + 2} className="mut">Nothing to show.</td></tr>}
      </tbody></table></div>
      <p className="mut" style={{ fontSize: 12, marginTop: 10 }}>Red = sold out · amber = at or below the product’s low-stock alert. Edit any number, then Save.</p>
    </>
  );
}
