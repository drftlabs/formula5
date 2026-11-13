"use client";
import { useEffect, useState } from "react";
import { dayFmt, STATUS, STEPS, inr } from "@/lib/format";

// "Track order" window. Open it from anywhere with openTrack() (footer button / link).
export const openTrack = (order = "") => window.dispatchEvent(new CustomEvent("tk:track", { detail: { order } }));

export default function TrackModal() {
  const [open, setOpen] = useState(false), [num, setNum] = useState(""), [email, setEmail] = useState(""), [busy, setBusy] = useState(false), [err, setErr] = useState(""), [order, setOrder] = useState(null);
  useEffect(() => {
    const o = (e) => { setOpen(true); setErr(""); setOrder(null); if (e?.detail?.order) setNum(String(e.detail.order)); try { const s = JSON.parse(localStorage.getItem("tk_co") || "null"); if (s?.email) setEmail((e) => e || s.email); } catch {} };
    addEventListener("tk:track", o); return () => removeEventListener("tk:track", o);
  }, []);
  useEffect(() => {
    if (!open) return; document.body.style.overflow = "hidden";
    const k = (e) => e.key === "Escape" && setOpen(false); addEventListener("keydown", k);
    return () => { removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [open]);
  if (!open) return null;
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr(""); setOrder(null);
    try {
      const r = await fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: num, email }) });
      const j = await r.json(); if (!r.ok) setErr(j.error || "Something went wrong."); else setOrder(j.order);
    } catch { setErr("Network problem. Please try again."); }
    setBusy(false);
  };
  const idx = order ? STEPS.indexOf(order.status) : -1;
  return (
    <div className="qc sg" role="dialog" aria-modal="true" aria-label="Track your order">
      <div className="qc-scrim" onClick={() => setOpen(false)} />
      <div className="qc-panel narrow">
        <div className="qc-head"><b>Track your order</b><button className="ib" aria-label="Close" onClick={() => setOpen(false)}><svg viewBox="0 0 24 24"><path d="M5 5l14 14M19 5 5 19" /></svg></button></div>
        <div className="qc-body">
          <form className="tm-form" onSubmit={submit}>
            <label htmlFor="tm-o">Order number</label>
            <input id="tm-o" value={num} onChange={(e) => setNum(e.target.value)} placeholder="TK-1001" autoCapitalize="characters" autoComplete="off" required autoFocus />
            <label htmlFor="tm-e">Email used at checkout</label>
            <input id="tm-e" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" autoComplete="email" required />
            <button className="btn" disabled={busy}>{busy ? "Looking…" : "Track order"}</button>
          </form>
          {err && <p className="msg-err tm-msg">{err}</p>}
          {order && (
            <article className="order tm-order">
              <div className="order-top"><div><b>{order.order_number}</b><div className="tm-sub">{dayFmt(order.created_at)} · {inr(order.total)}</div></div><span className={"badge " + order.status}>{STATUS[order.status]}</span></div>
              {idx >= 0 && <div className="steps">{STEPS.map((s, i) => <div key={s} className={i <= idx ? "on" : ""}>{STATUS[s]}</div>)}</div>}
              <div className="o-items">{(order.items || []).map((i, k) => <div key={k}>{i.name} · UK {i.size}{i.color ? ` · ${i.color}` : ""} × {i.qty}</div>)}</div>
              {order.tracking_number && <div className="track"><b>Tracking</b><br />{order.courier || "Courier"}: {order.tracking_number}{order.tracking_url && <> · <a href={order.tracking_url} target="_blank" rel="noopener">Track package</a></>}</div>}
            </article>
          )}
        </div>
      </div>
    </div>
  );
}
