import Link from "next/link";
import { serviceClient } from "@/lib/supabase/server";
import TrackingImport from "@/components/admin/TrackingImport";
import Row from "@/components/admin/Row";
import { PayBadge, StageBadge, RepeatBadge } from "@/components/admin/Bits";
import { inr, dateFmt } from "@/lib/format";
import { STAGE, repeatMap } from "@/lib/orderMeta";
import { loadRepeatBase } from "@/lib/stats";

const FILTERS = ["all", "paid", "processing", "shipped", "delivered", "cancelled", "refunded", "pending_payment"];
const FLABEL = { ...STAGE, paid: "Unfulfilled (new)" };
export default async function Orders({ searchParams }) {
  const status = FILTERS.includes(searchParams.status) ? searchParams.status : "all";
  const pay = ["cod", "online"].includes(searchParams.pay) ? searchParams.pay : "all";
  const q = String(searchParams.q || "").trim().replace(/[%,()]/g, "");
  const sb = serviceClient();
  let query = sb.from("orders").select("*").order("created_at", { ascending: false }).limit(200);
  if (status !== "all") query = query.eq("status", status); else query = query.neq("status", "pending_payment");
  if (pay === "cod") query = query.eq("payment_method", "cod"); else if (pay === "online") query = query.neq("payment_method", "cod");
  if (q) query = query.or(`order_number.ilike.%${q}%,email.ilike.%${q}%,name.ilike.%${q}%,phone.ilike.%${q}%`);
  const [{ data: orders }, base] = await Promise.all([query, loadRepeatBase(sb)]);
  const rep = repeatMap(base);
  const href = (o) => "?" + new URLSearchParams({ ...(status !== "all" ? { status } : {}), ...(pay !== "all" ? { pay } : {}), ...(q ? { q } : {}), ...o }).toString();
  const clear = (k) => { const o = { status, pay, q }; delete o[k]; return "?" + new URLSearchParams(Object.fromEntries(Object.entries(o).filter(([, v]) => v && v !== "all"))).toString(); };
  return (
    <>
      <h1>Orders</h1><p className="sub">Click anywhere on an order to open it. Export orders for your courier, then import tracking numbers back: customers are emailed automatically.</p>
      <div className="bar-actions">
        {FILTERS.map((f) => <Link key={f} className={"abtn sm " + (f === status ? "" : "ghost")} href={f === "all" ? clear("status") : href({ status: f })}>{f === "all" ? "All" : FLABEL[f]}</Link>)}
      </div>
      <div className="bar-actions">
        <span className="mut" style={{ fontSize: 12 }}>Payment:</span>
        {[["all", "Any"], ["online", "Prepaid"], ["cod", "COD"]].map(([k, l]) => <Link key={k} className={"abtn sm " + (k === pay ? "" : "ghost")} href={k === "all" ? clear("pay") : href({ pay: k })}>{l}</Link>)}
      </div>
      <div className="bar-actions">
        <form style={{ display: "flex", gap: 8 }}><input className="in" style={{ width: 280 }} name="q" defaultValue={q} placeholder="Search order #, name, email, phone" />{status !== "all" && <input type="hidden" name="status" value={status} />}{pay !== "all" && <input type="hidden" name="pay" value={pay} />}<button className="abtn sm">Search</button></form>
        <a className="abtn sm ghost" href={`/admin/orders/export${status !== "all" ? `?status=${status}` : ""}`}>⬇ Export CSV</a>
      </div>
      <div className="tblwrap"><table className="tbl"><thead><tr><th>Order</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Payment</th><th>Fulfilment</th><th>Tracking</th></tr></thead><tbody>
        {(orders || []).map((o) => <Row key={o.id} href={`/admin/orders/${o.id}`}>
          <td><Link href={`/admin/orders/${o.id}`}><b>{o.order_number}</b></Link></td>
          <td className="mut">{dateFmt(o.created_at)}</td>
          <td>{o.name}<br /><span className="mut">{o.email}</span><div style={{ marginTop: 4 }}><RepeatBadge r={rep.get(o.id)} /></div></td>
          <td>{(o.items || []).reduce((t, i) => t + i.qty, 0)}</td><td>{inr(o.total)}</td>
          <td><PayBadge o={o} /></td><td><StageBadge o={o} /></td><td className="mut">{o.tracking_number || "-"}</td></Row>)}
        {!orders?.length && <tr><td colSpan="8" className="mut">No orders found.</td></tr>}
      </tbody></table></div>
      <h2>Bulk tracking</h2><TrackingImport />
    </>
  );
}
