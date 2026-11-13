"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrder, cancelOrder, deleteOrder } from "@/lib/actions/admin";
import { Field } from "./Fields";
import { STAGE } from "@/lib/orderMeta";

const FLOW = ["paid", "processing", "shipped", "delivered"];
export default function OrderControls({ order, canDelete = false }) {
  const cancelled = order.status === "cancelled";
  const [o, setO] = useState({ status: order.status, courier: order.courier || "", tracking_number: order.tracking_number || "", tracking_url: order.tracking_url || "", notes: order.notes || "", cod_collected: false });
  const [c, setC] = useState({ reason: "", restock: !["shipped", "delivered"].includes(order.status), notify: true });
  const [msg, setMsg] = useState(null), [pending, start] = useTransition(), router = useRouter();
  const s = (k) => (v) => setO((x) => ({ ...x, [k]: v }));
  const opts = [...FLOW, "refunded"].map((k) => [k, STAGE[k]]);
  const run = (fn) => start(async () => { const r = await fn(); setMsg(r?.error ? { err: r.error } : { ok: r?.ok === true && r.restocked === false ? "Done (stock could not be restored automatically, check Inventory)" : "Done" }); router.refresh(); });
  const save = (patch = {}) => run(() => updateOrder(order.id, { ...o, ...patch }));
  const idx = FLOW.indexOf(order.status);

  return (
    <>
      {!cancelled && (
        <div className="panel"><h2 style={{ marginTop: 0 }}>Fulfilment</h2>
          <div className="stepper">{FLOW.map((k, i) => <span key={k} className={i < idx ? "done" : i === idx ? "cur" : ""}>{i < idx ? "✓ " : ""}{STAGE[k]}</span>)}</div>
          <div className="bar-actions">
            {order.status === "paid" && <button className="abtn sm" disabled={pending} onClick={() => save({ status: "processing" })}>Mark as packing</button>}
            {["paid", "processing"].includes(order.status) && <button className="abtn sm ghost" disabled={pending || !o.tracking_number} title={o.tracking_number ? "" : "Add a tracking number first"} onClick={() => save({ status: "shipped" })}>Mark as shipped (emails customer)</button>}
            {order.status === "shipped" && <button className="abtn sm" disabled={pending} onClick={() => save({ status: "delivered" })}>Mark as delivered</button>}
          </div>
          <div className="af">
            <Field f={{ name: "status", label: "Status", type: "select", options: opts }} value={o.status} onChange={s("status")} />
            <Field f={{ name: "courier", label: "Courier", type: "text" }} value={o.courier} onChange={s("courier")} />
            <Field f={{ name: "tracking_number", label: "Tracking number", type: "text" }} value={o.tracking_number} onChange={s("tracking_number")} />
            <Field f={{ name: "tracking_url", label: "Tracking link (optional)", type: "text" }} value={o.tracking_url} onChange={s("tracking_url")} />
            <Field f={{ name: "notes", label: "Internal notes", type: "textarea", full: true }} value={o.notes} onChange={s("notes")} />
          </div>
          {order.payment_method === "cod" && order.amount_due > 0 && <label className="chk"><input type="checkbox" checked={o.cod_collected} onChange={(e) => setO((x) => ({ ...x, cod_collected: e.target.checked }))} />Cash on delivery collected (mark ₹{order.amount_due} as received)</label>}
          <p className="mut" style={{ fontSize: 12, marginTop: 10 }}>Setting the status to “Shipped” emails the customer their tracking details.</p>
          <div className="bar-actions" style={{ marginTop: 14 }}>
            <button className="abtn" disabled={pending} onClick={() => save()}>{pending ? "Saving…" : "Save"}</button>
            {msg && <span className={"flash" + (msg.err ? " err" : "")} style={{ margin: 0 }}>{msg.err || msg.ok}</span>}
          </div>
        </div>
      )}
      {cancelled && <div className="panel"><h2 style={{ marginTop: 0 }}>Order cancelled</h2><p className="mut" style={{ margin: 0 }}>{order.cancel_reason ? `Reason: ${order.cancel_reason}` : "This order was cancelled."}{order.payment_method !== "cod" && " If it was paid online, refund it from the Razorpay dashboard (Payments → the payment → Refund)."}</p></div>}

      {!cancelled && (
        <div className="panel danger-zone"><h2 style={{ marginTop: 0 }}>Cancel order</h2>
          <div className="af">
            <Field f={{ name: "reason", label: "Reason (optional)", type: "text", full: true }} value={c.reason} onChange={(v) => setC((x) => ({ ...x, reason: v }))} />
          </div>
          <label className="chk"><input type="checkbox" checked={c.restock} onChange={(e) => setC((x) => ({ ...x, restock: e.target.checked }))} />Put the pairs back in stock</label>
          <label className="chk" style={{ marginTop: 8 }}><input type="checkbox" checked={c.notify} onChange={(e) => setC((x) => ({ ...x, notify: e.target.checked }))} />Email the customer that it was cancelled</label>
          {order.payment_method !== "cod" && <p className="mut" style={{ fontSize: 12 }}>Prepaid order: after cancelling, refund the customer from your Razorpay dashboard.</p>}
          <div className="bar-actions" style={{ marginTop: 12 }}>
            <button className="abtn danger" disabled={pending} onClick={() => { if (confirm(`Cancel order ${order.order_number}?`)) run(() => cancelOrder(order.id, c)); }}>Cancel this order</button>
          </div>
        </div>
      )}
      {canDelete && (
        <div className="panel danger-zone"><h2 style={{ marginTop: 0 }}>Delete order</h2>
          <p className="mut" style={{ margin: "0 0 12px", fontSize: 13 }}>Removes the order and its record for good. Cancel it instead if you only want it out of your sales. Stock is not put back when you delete.</p>
          <button className="abtn danger" disabled={pending} onClick={() => { if (confirm(`Permanently delete ${order.order_number}? This cannot be undone.`)) start(async () => { const r = await deleteOrder(order.id); if (r?.error) setMsg({ err: r.error }); else { router.push("/admin/orders"); router.refresh(); } }); }}>Delete permanently</button>
          {msg?.err && <span className="flash err" style={{ marginLeft: 10 }}>{msg.err}</span>}
        </div>
      )}
    </>
  );
}
