"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setCollectionProducts } from "@/lib/actions/admin";

export default function CollectionProducts({ collection, products, selected }) {
  const [sel, setSel] = useState(selected), [q, setQ] = useState(""), [msg, setMsg] = useState(null), [pending, start] = useTransition(), router = useRouter();
  const t = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const shown = products.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <div className="bar-actions">
        <input className="in" style={{ width: 240 }} placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="abtn sm ghost" onClick={() => setSel(products.map((p) => p.id))}>Select all</button><button className="abtn sm ghost" onClick={() => setSel([])}>Clear</button>
        <span className="mut" style={{ fontSize: 12 }}>{sel.length} in “{collection.name}”</span>
        <button className="abtn" disabled={pending} onClick={() => start(async () => { const r = await setCollectionProducts(collection.id, sel); setMsg(r.error ? { err: r.error } : { ok: "Saved" }); router.refresh(); })}>{pending ? "Saving…" : "Save collection"}</button>
        {msg && <span className={"flash" + (msg.err ? " err" : "")} style={{ margin: 0 }}>{msg.err || msg.ok}</span>}
      </div>
      <div className="pickgrid">
        {shown.map((p) => <label key={p.id} className={"pick" + (sel.includes(p.id) ? " on" : "")}><input type="checkbox" checked={sel.includes(p.id)} onChange={() => t(p.id)} /><div className="th">{p.images?.[0] && <img src={p.images[0]} alt="" />}</div><b>{p.name}</b><small>{p.active ? "Live" : "Hidden"}</small></label>)}
      </div>
    </>
  );
}
