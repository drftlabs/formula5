import Link from "next/link";
import { notFound } from "next/navigation";
import { serviceClient } from "@/lib/supabase/server";
import { getAdminCtx } from "@/lib/admin";
import OrderControls from "@/components/admin/OrderControls";
import { StageBadge, RepeatBadge, ContactBtns, Pill } from "@/components/admin/Bits";
import { inr, dateFmt } from "@/lib/format";
import { payInfo, paidOnline, repeatMap, emailKey, phoneKey, VALID } from "@/lib/orderMeta";
import { loadRepeatBase } from "@/lib/stats";

export default async function OrderPage({ params }) {
  const sb = serviceClient();
  const { data: o } = await sb.from("orders").select("*").eq("id", params.id).maybeSingle();
  if (!o) notFound();
  const [ctx, base] = await Promise.all([getAdminCtx(), loadRepeatBase(sb)]);
  const rep = repeatMap(base).get(o.id);
  const e = emailKey(o.email), p = phoneKey(o.phone);
  const mine = base.filter((x) => x.id !== o.id && (emailKey(x.email) === e || (p.length === 10 && phoneKey(x.phone) === p)));
  const a = o.shipping_address || {}, cod = o.payment_method === "cod", pay = payInfo(o);
  const events = [["Order placed", o.created_at], o.paid_at && [cod ? "Order confirmed" : "Payment received", o.paid_at], o.shipped_at && ["Shipped", o.shipped_at], o.delivered_at && ["Delivered", o.delivered_at], o.cancelled_at && ["Cancelled", o.cancelled_at]].filter(Boolean);
  const msg = `Hi ${String(o.name || "").split(" ")[0]}, this is Taeken about your order ${o.order_number}. `;
  return (
    <>
      <p className="mut"><Link href="/admin/orders">← Orders</Link></p>
      <h1>{o.order_number} <StageBadge o={o} /> <Pill tone={pay.tone}>{pay.label}</Pill></h1>
      <p className="sub">Placed {dateFmt(o.created_at)}{o.paid_at && <> · {cod ? "Confirmed" : "Paid"} {dateFmt(o.paid_at)}</>} <RepeatBadge r={rep} /></p>
      {rep?.prev > 0 && <p className="flash" style={{ borderColor: rep.gapH < 24 ? "#ff7a7f" : "#9cc7ff", background: rep.gapH < 24 ? "#2a1618" : "#16212e" }}>⚠ <b>Repeat order.</b> This is the customer&apos;s order #{rep.n}{rep.gapH != null && <> placed {rep.gapH < 1 ? "under an hour" : rep.gapH < 48 ? `${Math.round(rep.gapH)} hours` : `${Math.round(rep.gapH / 24)} days`} after their previous one</>}. {rep.gapH < 24 ? "Check it isn't an accidental duplicate before packing." : "Returning customer."}</p>}

      <div className="af" style={{ alignItems: "start" }}>
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>Customer</h2>
          <p><b>{o.name}</b><br />{o.email}<br />{o.phone}</p>
          <ContactBtns phone={o.phone} email={o.email} name={o.name} msg={msg} />
          <p style={{ marginTop: 12, fontSize: 13 }}><Link className="link" href={`/admin/customers/${encodeURIComponent(e)}`}>View customer profile</Link> <span className="mut">· {mine.length + 1} order{mine.length ? "s" : ""} in total</span></p>
          {mine.length > 0 && <p className="mut" style={{ fontSize: 12, margin: 0 }}>Other orders: {mine.slice(-4).map((x) => <Link key={x.id} className="link" href={`/admin/orders/${x.id}`} style={{ marginRight: 8 }}>{dateFmt(x.created_at).slice(0, 6)}</Link>)}</p>}
          <h2>Ship to</h2><p>{a.line1}<br />{a.line2 && <>{a.line2}<br /></>}{a.area && <>{a.area}<br /></>}{a.city}, {a.state} {a.pin}</p>
        </div>
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>Payment</h2>
          <table className="kv"><tbody>
            <tr><td>Method</td><td><b>{cod ? "Cash on delivery" : "Online (Razorpay)"}</b></td></tr>
            <tr><td>Payment status</td><td><Pill tone={pay.tone}>{pay.label}</Pill> <span className="mut">{pay.sub}</span></td></tr>
            <tr><td>Paid online</td><td>{inr(paidOnline(o))}</td></tr>
            {cod && <tr><td>Cash to collect</td><td><b>{inr(o.amount_due)}</b></td></tr>}
            <tr><td>Razorpay payment ID</td><td>{o.razorpay_payment_id && o.razorpay_payment_id !== "COD" ? <code>{o.razorpay_payment_id}</code> : <span className="mut">{cod && !o.razorpay_payment_id ? "-" : o.razorpay_payment_id || "-"}</span>}</td></tr>
            <tr><td>Razorpay order ID</td><td>{o.razorpay_order_id ? <code>{o.razorpay_order_id}</code> : <span className="mut">{cod ? "none (no online payment)" : "-"}</span>}</td></tr>
            {o.discount_code && <tr><td>Discount code</td><td><b>{o.discount_code}</b> <span className="mut">−{inr(o.discount)}</span></td></tr>}
          </tbody></table>
          <p style={{ marginTop: 12 }}>Subtotal {inr(o.subtotal)}<br />{o.discount > 0 && <>Discount {o.discount_code && `(${o.discount_code})`} −{inr(o.discount)}<br /></>}{cod ? "COD delivery fee" : "Shipping"} {o.shipping ? inr(o.shipping) : "Free"}<br /><b style={{ fontSize: 18 }}>Total {inr(o.total)}</b></p>
        </div>
        <div className="panel">
          <h2 style={{ marginTop: 0 }}>Timeline</h2>
          {events.map(([l, t]) => <div key={l} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 0", borderBottom: "1px solid #26262a", fontSize: 13 }}><span>{l}</span><span className="mut">{dateFmt(t)}</span></div>)}
          {o.tracking_number && <p style={{ marginTop: 10, fontSize: 13 }}>{o.courier || "Courier"}: <b>{o.tracking_number}</b>{o.tracking_url && <> · <a className="link" href={o.tracking_url} target="_blank" rel="noopener">track</a></>}</p>}
          {o.cancel_reason && <p className="mut" style={{ fontSize: 13 }}>Cancel reason: {o.cancel_reason}</p>}
        </div>
      </div>
      <h2>Items</h2>
      <div className="tblwrap"><table className="tbl"><thead><tr><th></th><th>Product</th><th>UK size</th><th>Qty</th><th>Price</th></tr></thead><tbody>
        {o.items.map((i, k) => <tr key={k}><td><div className="thumbs-adm">{i.image && <img src={i.image} alt="" />}</div></td><td>{i.name}{i.color && <span className="mut"> · {i.color}</span>}</td><td>{i.size}</td><td>{i.qty}</td><td>{inr(i.price * i.qty)}</td></tr>)}
      </tbody></table></div>
      <OrderControls order={o} canDelete={!!ctx?.perms.includes("orders_delete")} />
    </>
  );
}
