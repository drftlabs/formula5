"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendReminder } from "@/lib/actions/abandoned";
import { inr, dateFmt } from "@/lib/format";
import { phoneIntl } from "@/lib/orderMeta";

export default function AbandonedList({ rows }) {
  const [code, setCode] = useState(""), [state, setState] = useState({}), [pending, start] = useTransition(), router = useRouter();
  const send = async (r) => {
    setState((s) => ({ ...s, [r.id]: "…" }));
    const res = await sendReminder(r.kind, r.id, code);
    setState((s) => ({ ...s, [r.id]: res?.error ? { err: res.error } : "Sent ✓" }));
    return res;
  };
  const sendAll = () => { const todo = rows.filter((r) => !r.reminded_at && !r.recovered && /\S+@\S+/.test(r.email || "")); if (!todo.length || !confirm(`Email a reminder to ${todo.length} customer${todo.length > 1 ? "s" : ""}?`)) return; start(async () => { for (const r of todo) await send(r); router.refresh(); }); };
  return (
    <>
      <div className="bar-actions">
        <input className="in" style={{ width: 240 }} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Discount code to include (optional)" />
        <button className="abtn sm" disabled={pending} onClick={sendAll}>{pending ? "Sending…" : "Email all open"}</button>
      </div>
      <div className="tblwrap"><table className="tbl"><thead><tr><th>Last active</th><th>Customer</th><th>Bag</th><th>Value</th><th>Stage</th><th>Reminder</th><th></th></tr></thead><tbody>
        {rows.map((r) => { const p = phoneIntl(r.phone), st = state[r.id]; return (
          <tr key={r.kind + r.id}>
            <td className="mut">{dateFmt(r.when)}</td>
            <td><b>{r.name || "-"}</b><br /><span className="mut">{r.email}{r.phone ? ` · ${r.phone}` : ""}{r.city ? ` · ${r.city}` : ""}</span>
              <div className="bar-actions" style={{ margin: "6px 0 0", gap: 6 }}>
                {p && <a className="abtn ghost sm" href={`tel:+${p}`}>📞 Call</a>}
                {p && <a className="abtn ghost sm" href={`https://wa.me/${p}?text=${encodeURIComponent(`Hi ${String(r.name || "").split(" ")[0] || "there"}, you left something in your Formula 5 bag. Need any help completing your order?`)}`} target="_blank" rel="noopener">💬 WhatsApp</a>}
                {r.email && <a className="abtn ghost sm" href={`mailto:${r.email}`}>✉ Email</a>}</div></td>
            <td className="mut" style={{ maxWidth: 260 }}>{(r.items || []).map((i) => `${i.name} (Pack ${i.size})×${i.qty}`).join(", ")}</td>
            <td>{inr(r.total)}</td><td className="mut">{r.stage}</td>
            <td>{r.recovered ? <span className="pill" style={{ background: "#EAF4EC", color: "#2E7D4F" }}>Ordered</span> : r.reminded_at ? <span className="mut">Sent {dateFmt(r.reminded_at)}{r.count > 1 ? ` (×${r.count})` : ""}</span> : <span className="mut">Not sent</span>}</td>
            <td>{!r.recovered && /\S+@\S+/.test(r.email || "") && <button className="abtn sm ghost" disabled={pending || st === "…"} onClick={() => send(r).then(() => router.refresh())}>{st === "…" ? "Sending…" : r.reminded_at ? "Send again" : "Send reminder"}</button>}
              {st && st !== "…" && <div style={{ fontSize: 11, marginTop: 4, color: st.err ? "#A33B34" : "#2E7D4F" }}>{st.err || st}</div>}</td>
          </tr>); })}
        {!rows.length && <tr><td colSpan="7" className="mut">Nothing here. Abandoned carts appear once a visitor has entered their email at checkout and left for 30 minutes.</td></tr>}
      </tbody></table></div>
    </>
  );
}
