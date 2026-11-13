import Link from "next/link";
import { serviceClient } from "@/lib/supabase/server";
import { inr, dateFmt } from "@/lib/format";
import { repeatMap } from "@/lib/orderMeta";
import { resolveRange, loadOrders, loadEvents, orderStats, eventStats, sliceOrders, sliceEvents, series, lookback, dayStart, addDays, pct, fmtDur } from "@/lib/stats";
import { Kpi, RangeBar, SalesChart, Funnel, BarList, PayBadge, StageBadge, RepeatBadge, Pill } from "@/components/admin/Bits";
import Row from "@/components/admin/Row";

export default async function Dashboard({ searchParams }) {
  const sb = serviceClient();
  if (!sb) return <p className="flash err">SUPABASE_SERVICE_ROLE_KEY is not set.</p>;
  const r = resolveRange(searchParams);
  const since = [r.from, r.cmp?.from, addDays(r.today, -400)].filter(Boolean).sort()[0];
  const evFrom = [r.from, r.cmp?.from].filter(Boolean).sort()[0], evTo = [r.to, r.cmp?.to].filter(Boolean).sort().reverse()[0];
  const hourAgo = new Date(Date.now() - 3600e3).toISOString(), week = new Date(Date.now() - 7 * 864e5).toISOString();
  const [orders, ev, toShip, pendingPay, newMsg, msgRange, prods, ab] = await Promise.all([
    loadOrders(sb, dayStart(since).toISOString()),
    loadEvents(sb, dayStart(evFrom).toISOString(), dayStart(addDays(evTo, 1)).toISOString()),
    sb.from("orders").select("id", { count: "exact", head: true }).in("status", ["paid", "processing"]),
    sb.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending_payment").gte("created_at", week).lt("created_at", hourAgo),
    sb.from("messages").select("id", { count: "exact", head: true }).eq("status", "new"),
    sb.from("messages").select("id", { count: "exact", head: true }).gte("created_at", dayStart(r.from).toISOString()).lt("created_at", dayStart(addDays(r.to, 1)).toISOString()),
    sb.from("products").select("id,name,sizes,active"),
    sb.from("checkouts").select("sid", { count: "exact", head: true }).not("email", "is", null).is("reminded_at", null).gte("updated_at", week).lt("updated_at", hourAgo),
  ]);
  const cur = orderStats(sliceOrders(orders, r.from, r.to)), prv = r.cmp ? orderStats(sliceOrders(orders, r.cmp.from, r.cmp.to)) : null;
  const e = eventStats(sliceEvents(ev.rows, r.from, r.to)), pe = r.cmp ? eventStats(sliceEvents(ev.rows, r.cmp.from, r.cmp.to)) : null;
  const conv = pct(cur.count, e.sessions), pconv = pe ? pct(prv.count, pe.sessions) : null;
  const data = series(orders, r.from, r.to, r.by), cmp = r.cmp ? series(orders, r.cmp.from, r.cmp.to, r.by) : null;
  const weeks = lookback(orders, "week", 8), months = lookback(orders, "month", 12);
  const rep = repeatMap(orders), recent = orders.slice(0, 10);
  const low = (prods.data || []).filter((p) => p.active && Object.values(p.sizes || {}).reduce((t, n) => t + Number(n), 0) <= 5);
  const qs = (o) => "?" + new URLSearchParams({ ...Object.fromEntries(Object.entries(searchParams).filter(([k]) => ["range", "from", "to", "compare", "cfrom", "cto"].includes(k))), ...o }).toString();
  const total = cur.count || 1;

  return (
    <>
      <h1>Dashboard</h1><p className="sub">Sales, traffic and what needs your attention.</p>
      <RangeBar r={r} path="/admin" extra={searchParams.by ? { by: r.by } : {}} />

      <div className="attn">
        <Link href="/admin/orders?status=paid"><b>{toShip.count ?? 0}</b> orders to pack &amp; ship</Link>
        <Link href="/admin/messages"><b>{newMsg.count ?? 0}</b> new messages</Link>
        <Link href="/admin/abandoned"><b>{ab.count ?? 0}</b> abandoned carts</Link>
        <Link href="/admin/orders?status=pending_payment"><b>{pendingPay.count ?? 0}</b> unpaid checkouts</Link>
        <Link href="#low"><b>{low.length}</b> low-stock products</Link>
      </div>

      <div className="kpis">
        <Kpi label="Sales" value={inr(cur.sales)} cur={cur.sales} prev={prv?.sales} sub={`${cur.units} pairs`} />
        <Kpi label="Orders" value={cur.count} cur={cur.count} prev={prv?.count} sub={cur.cancelled ? `${cur.cancelled} cancelled` : ""} />
        <Kpi label="Avg. order value" value={inr(cur.aov)} cur={cur.aov} prev={prv?.aov} />
        <Kpi label="Prepaid money received" value={inr(cur.collectedOnline)} cur={cur.collectedOnline} prev={prv?.collectedOnline} sub="online incl. COD advances" />
        <Kpi label="COD cash to collect" value={inr(cur.codToCollect)} cur={cur.codToCollect} prev={prv?.codToCollect} invert sub="from these orders" />
        <Kpi label="Visits" value={e.sessions.toLocaleString("en-IN")} cur={e.sessions} prev={pe?.sessions} sub={ev.missing ? "run migration_7" : ""} href="/admin/analytics" />
        <Kpi label="Conversion rate" value={`${conv}%`} cur={conv} prev={pconv} sub="orders ÷ visits" href="/admin/analytics" />
        <Kpi label="Discount used" value={cur.discountCount} cur={cur.discountCount} prev={prv?.discountCount} sub={`${inr(cur.discountTotal)} off`} />
        <Kpi label="Messages received" value={msgRange.count ?? 0} sub="in this period" href="/admin/messages" />
      </div>

      <div className="panel">
        <div className="ap-head"><h2 style={{ margin: 0 }}>Sales over time</h2>
          <div className="presets sm">{[["day", "Daily"], ["week", "Weekly"], ["month", "Monthly"]].map(([k, l]) => <Link key={k} href={qs({ by: k })} className={r.by === k ? "on" : ""}>{l}</Link>)}</div></div>
        <SalesChart data={data} cmp={cmp} />
        <p className="mut" style={{ fontSize: 12, margin: "6px 0 0" }}><span className="ap-dot red" /> This period{cmp && <> &nbsp; <span className="ap-dot gray" /> {`${r.compare === "prev" ? "Previous period" : "Comparison"} (matched by position)`}</>}</p>
      </div>

      <div className="two">
        <div className="panel"><h2 style={{ marginTop: 0 }}>Conversion funnel</h2>
          {ev.missing ? <p className="mut">Traffic tracking starts after you run <code>migration_7.sql</code> in Supabase.</p> : <>
            <Funnel steps={[{ l: "Visits", v: e.sessions }, { l: "Added to bag", v: e.cart, p: pct(e.cart, e.sessions) }, { l: "Reached checkout", v: e.checkout, p: pct(e.checkout, e.cart) }, { l: "Purchased", v: cur.count, p: pct(cur.count, e.checkout) }]} />
            <p className="mut" style={{ fontSize: 12, marginTop: 10 }}>Avg. time on site {fmtDur(e.avgDur)} · <Link className="link" href="/admin/analytics">full traffic report</Link></p></>}
        </div>
        <div className="panel"><h2 style={{ marginTop: 0 }}>Payment mix</h2>
          <BarList items={[["Prepaid (online)", cur.prepaidCount, `${pct(cur.prepaidCount, total)}% · ${inr(cur.prepaidSales)}`], ["Cash on delivery", cur.codCount, `${pct(cur.codCount, total)}% · ${inr(cur.codSales)}`]]} empty="No orders in this period." />
          <div className="mix"><div><span className="mut">Received online</span><b>{inr(cur.collectedOnline)}</b></div><div><span className="mut">COD still to collect</span><b>{inr(cur.codToCollect)}</b></div></div>
        </div>
      </div>

      <h2>Recent orders</h2>
      <div className="tblwrap"><table className="tbl"><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Payment</th><th>Fulfilment</th><th>Placed</th></tr></thead><tbody>
        {recent.map((o) => <Row key={o.id} href={`/admin/orders/${o.id}`}>
          <td><Link href={`/admin/orders/${o.id}`}><b>{o.order_number}</b></Link></td>
          <td>{o.name}<div style={{ marginTop: 4 }}><RepeatBadge r={rep.get(o.id)} /></div></td>
          <td>{inr(o.total)}</td><td><PayBadge o={o} /></td><td><StageBadge o={o} /></td><td className="mut">{dateFmt(o.created_at)}</td></Row>)}
        {!recent.length && <tr><td colSpan="6" className="mut">No orders yet.</td></tr>}
      </tbody></table></div>
      <p style={{ marginTop: 8 }}><Link className="link" href="/admin/orders">All orders →</Link></p>

      <h2>Weekly &amp; monthly sales</h2>
      <div className="two">
        {[["Last 8 weeks", weeks, "Week of"], ["Last 12 months", months, "Month"]].map(([t, rows, h]) => (
          <div key={t}><p className="lbl">{t}</p>
            <div className="tblwrap"><table className="tbl"><thead><tr><th>{h}</th><th>Orders</th><th>Sales</th><th>Prepaid</th><th>COD</th></tr></thead><tbody>
              {rows.map((s) => <tr key={s.key}><td>{s.label.replace("Wk ", "")}</td><td>{s.orders}</td><td><b>{inr(s.sales)}</b></td><td className="mut">{inr(s.prepaid)}</td><td className="mut">{inr(s.cod)}</td></tr>)}
            </tbody></table></div></div>
        ))}
      </div>

      {low.length > 0 && <><h2 id="low">Low stock</h2><div className="panel">{low.map((p) => <div key={p.id}><Link href={`/admin/products/${p.id}`}>{p.name}</Link> <span className="mut">· {Object.values(p.sizes || {}).reduce((t, n) => t + Number(n), 0)} pairs left</span></div>)}</div></>}
    </>
  );
}
