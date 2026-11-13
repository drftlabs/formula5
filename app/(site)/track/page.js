import Link from "next/link";
import { serviceClient } from "@/lib/supabase/server";
import { dayFmt, STATUS, STEPS, inr } from "@/lib/format";

export const metadata = { title: "Track your order" };
export const dynamic = "force-dynamic";

export default async function Track({ searchParams }) {
  const num = String(searchParams.order || "").trim().toUpperCase().slice(0, 20), email = String(searchParams.email || "").trim().toLowerCase().slice(0, 200);
  let order = null, tried = false;
  if (num && email) {
    tried = true; const sb = serviceClient();
    if (sb) { const { data } = await sb.from("orders").select("order_number,status,created_at,items,total,courier,tracking_number,tracking_url,email").eq("order_number", num).maybeSingle(); if (data && data.email.toLowerCase() === email && data.status !== "pending_payment") order = data; }
  }
  const idx = order ? STEPS.indexOf(order.status) : -1;
  return (
    <div className="page"><div className="wrap" style={{ maxWidth: 700 }}>
      <div className="crumbs"><Link href="/">Home</Link><span>Track order</span></div>
      <h1 className="page-title">Track your <em>order</em></h1>
      <p className="lead">Enter your order number and the email you used at checkout.</p>
      <form className="form" method="get">
        <div className="row"><div className="field"><label htmlFor="o">Order number</label><input id="o" name="order" placeholder="TK-1001" defaultValue={num} required /></div><div className="field"><label htmlFor="e">Email</label><input id="e" name="email" type="email" defaultValue={email} required /></div></div>
        <button className="btn formbtn">Track</button>
      </form>
      {tried && !order && <p className="msg-err" style={{ marginTop: 24 }}>We couldn't find a matching order. Check the order number and email.</p>}
      {order && (
        <article className="order" style={{ marginTop: 32 }}>
          <div className="order-top"><div><b>{order.order_number}</b><div style={{ fontSize: 12, color: "var(--concrete)", marginTop: 4 }}>{dayFmt(order.created_at)} · {inr(order.total)}</div></div><span className={"badge " + order.status}>{STATUS[order.status]}</span></div>
          {idx >= 0 && <div className="steps">{STEPS.map((s, i) => <div key={s} className={i <= idx ? "on" : ""}>{STATUS[s]}</div>)}</div>}
          <div className="o-items">{order.items.map((i, k) => <div key={k}>{i.name} · UK {i.size} × {i.qty}</div>)}</div>
          {order.tracking_number && <div className="track"><b>Tracking</b><br />{order.courier || "Courier"}: {order.tracking_number}{order.tracking_url && <> · <a href={order.tracking_url} target="_blank" rel="noopener">Track package</a></>}</div>}
        </article>
      )}
    </div></div>
  );
}
