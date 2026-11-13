"use client";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveRow, deleteRow, moveRow } from "@/lib/actions/admin";
import { Field } from "./Fields";

const getV = (row, name) => (name.startsWith("config.") ? row.config?.[name.slice(7)] : row[name]);
const setV = (row, name, val) => (name.startsWith("config.") ? { ...row, config: { ...(row.config || {}), [name.slice(7)]: val } } : { ...row, [name]: val });

function Preview({ kind, row }) {
  if (kind === "tag") return <span className="pill" style={{ background: row.bg, color: row.fg }}>{row.name || "Tag"}</span>;
  if (kind === "color") return <span className="sw" style={{ background: row.hex }} />;
  return null;
}

function Editor({ table, row, fields, sortable, preview, titleKey, isNew, onSaved, first, last }) {
  const [r, setR] = useState(row), [msg, setMsg] = useState(null), [pending, start] = useTransition(), router = useRouter();
  useEffect(() => setR(row), [row]);
  const run = (fn) => start(async () => { const res = await fn(); if (res?.error) setMsg({ err: res.error }); else { setMsg({ ok: "Saved" }); router.refresh(); onSaved?.(); setTimeout(() => setMsg(null), 1800); } });
  const off = r.active === false || r.enabled === false;
  const body = (
    <div className="body">
      <div className="af" style={{ paddingTop: 14 }}>{fields.map((f) => <Field key={f.name} f={f} value={getV(r, f.name)} onChange={(v) => setR((x) => setV(x, f.name, v))} />)}</div>
      <div className="acts">
        <button className="abtn" disabled={pending} onClick={() => run(async () => { const res = await saveRow(table, r.id || null, r); if (!res?.error && isNew) setR(row); return res; })}>{pending ? "Saving…" : isNew ? "Add" : "Save changes"}</button>
        {!isNew && sortable && <><button className="abtn ghost sm" disabled={pending || first} onClick={() => run(() => moveRow(table, r.id, "up"))}>▲ Move up</button><button className="abtn ghost sm" disabled={pending || last} onClick={() => run(() => moveRow(table, r.id, "down"))}>▼ Move down</button></>}
        {!isNew && <button className="abtn danger sm" disabled={pending} onClick={() => confirm("Delete this item? This cannot be undone.") && run(() => deleteRow(table, r.id))} style={{ marginLeft: "auto" }}>Delete</button>}
        {msg && <span className={"flash" + (msg.err ? " err" : "")} style={{ margin: 0 }}>{msg.err || msg.ok}</span>}
      </div>
    </div>
  );
  return (
    <details className={"row-card" + (off ? " off" : "")} open={isNew ? undefined : undefined}>
      <summary><Preview kind={preview} row={r} /><b>{isNew ? "+ Add new" : r[titleKey] || r.title || "Untitled"}</b>{!isNew && r.type && <span className="pill" style={{ background: "#26262a" }}>{r.type}</span>}{off && <span className="mut">hidden</span>}</summary>
      {body}
    </details>
  );
}

export default function ResourceManager({ table, rows, fields, fieldsByType, newTypes, sortable, titleKey = "name", blank = {}, preview }) {
  const [newType, setNewType] = useState(newTypes?.[0]?.[0] || "");
  const fieldsOf = (r) => (fieldsByType ? fieldsByType[r.type] || [] : fields);
  return (
    <div>
      {newTypes && <div className="bar-actions"><span className="lbl" style={{ margin: 0 }}>New block type</span><select className="in" style={{ width: 220 }} value={newType} onChange={(e) => setNewType(e.target.value)}>{newTypes.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>}
      <Editor key={"new" + newType} table={table} isNew row={{ ...blank, ...(newTypes ? { type: newType, title: "New block", config: {}, sort_order: (rows.length + 1) * 10 } : { sort_order: (rows.length + 1) * 10 }) }} fields={fieldsOf({ type: newType })} sortable={false} preview={preview} titleKey={titleKey} />
      {rows.map((r, i) => <Editor key={r.id} table={table} row={r} fields={fieldsOf(r)} sortable={sortable} preview={preview} titleKey={titleKey} first={i === 0} last={i === rows.length - 1} />)}
    </div>
  );
}
