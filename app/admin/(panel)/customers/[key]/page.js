import Link from "next/link";
import { notFound } from "next/navigation";
import { serviceClient } from "@/lib/supabase/server";
import Row from "@/components/admin/Row";
import { ContactBtns, Pill, PayBadge, StageBadge, RepeatBadge } from "@/components/admin/Bits";
import { inr, dateFmt, dayFmt } from "@/lib/format";
import { VALID, isCod, emailKey, phoneKey, repeatMap } from "@/lib/orderMeta";
import { loadRepeatBase } from "@/lib/stats";

export default async function Customer({ params }) {
  const key = emailKey(decodeURIComponent(params.key));
  const sb = serviceClient();
  const { data: byEmail } = await sb.from("orders").select("*").eq("email", key).neq("status", "pending_payment").order("created_at", { ascending: false });
  const rows = byEmail || [];
  if (!rows.length) notFound();
  const phone = rows[0].phone, pk = phoneKey(phone);
  // same phone number under another email = probably the same person; show those too
  const { data: byPhone } = pk.length === 10 ? await sb.from("orders").select("*").ilike("phone", `%${pk}`).neq("status", "pending_payment").order("created_at", { ascending: false }) : { data: [] };
  const seen = new Set(rows.map((o) => o.id)), orders = [...rows, ...(byPhone || []).filter((o) => !seen.has(o.id) && phoneKey(o.phone) === pk)].sort((a, b) => b.created_at.localeCompare(a.created_at));
  const [{ data: carts }, { data: msgs }, base] = await Promise.all([
    sb.from("checkouts").select("*").eq("email", key).not("sid", "like", "order:%").order("updated_at", { ascending: false }).limit(5),
    sb.from("messages").select("id,type,subject,category,status,created_at").ilike("email", key.replace(/[\\%_]/g, "\\$&")).order("created_at", { ascending: false }).limit(5),
    loadRepeatBase(sb),
  ]);
  const rep = repeatMap(base);
  const live = orders.filter(VALID), spend = live.reduce((t, o) => t + o.total, 0), cod = live.filter(isCod).length;
  const last = orders[0], a = last.shipping_address || {};
  const msg = `Hi ${String(last.name || "").split(" ")[0]}, this is Formula 5. `;
  const addrs = [...new Set(orders.map((o) => { const x = o.shipping_address || {}; return [x.line1, x.line2, x.area, x.city, x.state, x.pin].filter(Boolean).join(", "); }))].slice(0, 3);
  return (
    <>
      <p className="mut"><Link href="/admin/customers">← Customers</Link></p>
      <div className="cust-head">
        <div><h1 style={{ marginBottom: 4 }}>{last.name} {live.length >= 2 && <Pill tone="info">Repeat customer</Pill>}</h1><p className="sub" style={{ margin: 0 }}>{last.email} · {last.phone}</p></div>
        <ContactBtns phone={last.phone} email={last.email} name={last.name} msg={msg} size="" />
      </div>
      <div className="kpis" style={{ marginTop: 16 }}>
        <div className="kpi"><span>Orders placed</span><b>{live.length}</b><small className="mut">{orders.length - live.length ? `${orders.length - live.length} cancelled / refunded` : "all active"}</small></div>
        <div className="kpi"><span>Total spent</span><b>{inr(spend)}</b><small className="mut">avg {inr(live.length ? Math.round(spend / live.length) : 0)} per order</small></div>
        <div className="kpi"><span>Prepaid / COD</span><b>{live.length - cod} / {cod}</b></div>
        <div className="kpi"><span>First order</span><b style={{ fontSize: 20 }}>{dayFmt(orders[orders.length - 1].created_at)}</b></div>
        <div className="kpi"><span>Last order</span><b style={{ fontSize: 20 }}>{dayFmt(last.created_at)}</b></div>
      </div>

      <h2>Order history</h2>
      <div className="tblwrap"><table className="tbl"><thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Total</th><th>Payment</th><th>Fulfilment</th></tr></thead><tbody>
        {orders.map((o) => <Row key={o.id} href={`/admin/orders/${o.id}`}>
          <td><Link href={`/admin/orders/${o.id}`}><b>{o.order_number}</b></Link><div style={{ marginTop: 4 }}><RepeatBadge r={rep.get(o.id)} /></div></td>
          <td className="mut">{dateFmt(o.created_at)}</td><td className="mut">{(o.items || []).map((i) => `${i.name} (Pack ${i.size})×${i.qty}`).join(", ")}</td>
          <td>{inr(o.total)}</td><td><PayBadge o={o} /></td><td><StageBadge o={o} /></td></Row>)}
      </tbody></table></div>

      <div className="two" style={{ marginTop: 18 }}>
        <div className="panel"><h2 style={{ marginTop: 0 }}>Addresses used</h2>{addrs.map((x) => <p key={x} style={{ margin: "0 0 8px", fontSize: 13 }}>{x}</p>)}</div>
        <div className="panel"><h2 style={{ marginTop: 0 }}>Activity</h2>
          {(carts || []).length > 0 && <p style={{ fontSize: 13 }}>Abandoned carts: {carts.length} · <Link className="link" href="/admin/abandoned">open</Link></p>}
          {(msgs || []).map((m) => <p key={m.id} style={{ margin: "0 0 6px", fontSize: 13 }}><Pill tone={m.type === "complaint" ? "bad" : "mut"}>{m.type}</Pill> {m.subject || m.category || "Message"} <span className="mut">· {dayFmt(m.created_at)} · {m.status}</span></p>)}
          {!(carts || []).length && !(msgs || []).length && <p className="mut" style={{ margin: 0, fontSize: 13 }}>No messages or abandoned carts.</p>}
        </div>
      </div>
    </>
  );
}
