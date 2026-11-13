import { serviceClient } from "@/lib/supabase/server";
import AbandonedList from "@/components/admin/AbandonedList";
import { emailKey, phoneKey } from "@/lib/orderMeta";
import { loadOrders } from "@/lib/stats";
import { inr } from "@/lib/format";
import Link from "next/link";

export default async function Abandoned({ searchParams }) {
  const sb = serviceClient();
  const show = ["open", "reminded", "recovered", "all"].includes(searchParams.show) ? searchParams.show : "open";
  const since = new Date(Date.now() - 30 * 864e5).toISOString(), idle = new Date(Date.now() - 30 * 60e3).toISOString();
  const [cq, pq, orders] = await Promise.all([
    sb.from("checkouts").select("*").gte("updated_at", since).order("updated_at", { ascending: false }).limit(500),
    sb.from("orders").select("id,created_at,name,email,phone,items,total,shipping_address").eq("status", "pending_payment").gte("created_at", since).lt("created_at", idle).order("created_at", { ascending: false }).limit(500),
    loadOrders(sb, since),
  ]);
  if (cq.error && cq.error.code !== "PGRST116" && !cq.data) return <><h1>Abandoned carts</h1><p className="flash err">Run <code>supabase/migration_7.sql</code> in Supabase → SQL Editor to start collecting abandoned carts.</p></>;
  const rem = new Map((cq.data || []).filter((c) => c.sid.startsWith("order:")).map((c) => [c.sid, c]));
  const live = orders.filter((o) => !["cancelled", "refunded"].includes(o.status));
  const boughtAfter = (email, phone, t) => live.some((o) => new Date(o.created_at) >= new Date(t) - 60e3 && ((email && emailKey(o.email) === emailKey(email)) || (phoneKey(phone).length === 10 && phoneKey(o.phone) === phoneKey(phone))));
  const pendEmails = new Map((pq.data || []).map((o) => [emailKey(o.email), o.created_at]));
  const rows = [];
  for (const o of pq.data || []) {
    const r = rem.get(`order:${o.id}`);
    rows.push({ kind: "order", id: o.id, when: o.created_at, name: o.name, email: o.email, phone: o.phone, items: o.items || [], total: o.total, stage: "Payment not completed", city: o.shipping_address?.city, reminded_at: r?.reminded_at || null, count: r?.reminder_count || 0, recovered: boughtAfter(o.email, o.phone, o.created_at) });
  }
  for (const c of (cq.data || []).filter((x) => !x.sid.startsWith("order:") && x.email && (x.items || []).length && x.updated_at < idle)) {
    if (pendEmails.has(emailKey(c.email)) && pendEmails.get(emailKey(c.email)) >= c.created_at) continue;    // the unpaid order covers it
    rows.push({ kind: "cart", id: c.sid, when: c.updated_at, name: c.name, email: c.email, phone: c.phone, items: c.items, total: c.total, stage: c.phone && c.pin ? "Filled address, left" : "Entered contact, left", city: c.city, reminded_at: c.reminded_at, count: c.reminder_count, recovered: boughtAfter(c.email, c.phone, c.created_at) });
  }
  rows.sort((a, b) => b.when.localeCompare(a.when));
  const open = rows.filter((r) => !r.recovered && !r.reminded_at), reminded = rows.filter((r) => !r.recovered && r.reminded_at), rec = rows.filter((r) => r.recovered);
  const list = show === "open" ? open : show === "reminded" ? reminded : show === "recovered" ? rec : rows;
  return (
    <>
      <h1>Abandoned carts</h1><p className="sub">People who entered their details at checkout (or started paying) but did not order in the last 30 days. Call, WhatsApp or email them, or send a reminder email.</p>
      <div className="kpis">
        <div className="kpi"><span>Open</span><b>{open.length}</b><small className="mut">{inr(open.reduce((t, r) => t + r.total, 0))} in bags</small></div>
        <div className="kpi"><span>Reminder sent</span><b>{reminded.length}</b></div>
        <div className="kpi"><span>Came back &amp; ordered</span><b>{rec.length}</b><small className="mut">{inr(rec.reduce((t, r) => t + r.total, 0))}</small></div>
      </div>
      <div className="bar-actions">{[["open", "Open"], ["reminded", "Reminder sent"], ["recovered", "Recovered"], ["all", "All"]].map(([k, l]) => <Link key={k} className={"abtn sm " + (k === show ? "" : "ghost")} href={`?show=${k}`}>{l}</Link>)}</div>
      <AbandonedList rows={list} />
    </>
  );
}
