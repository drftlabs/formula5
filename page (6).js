import Link from "next/link";
import { serviceClient } from "@/lib/supabase/server";
import Row from "@/components/admin/Row";
import { ContactBtns, Pill } from "@/components/admin/Bits";
import { inr, dayFmt } from "@/lib/format";
import { VALID, isCod, emailKey } from "@/lib/orderMeta";
import { loadOrders } from "@/lib/stats";

/** Groups orders into customers (same email). */
function groupCustomers(orders) {
  const m = new Map();
  for (const o of orders) {
    const k = emailKey(o.email); if (!k) continue;
    const c = m.get(k) || { key: k, email: o.email, name: o.name, phone: o.phone, orders: 0, spend: 0, cod: 0, online: 0, cancelled: 0, last: o.created_at, first: o.created_at, city: "" };
    if (VALID(o)) { c.orders++; c.spend += Number(o.total) || 0; isCod(o) ? c.cod++ : c.online++; } else if (o.status === "cancelled") c.cancelled++;
    if (o.created_at >= c.last) { c.last = o.created_at; c.name = o.name || c.name; c.phone = o.phone || c.phone; c.city = o.shipping_address?.city || c.city; }
    if (o.created_at < c.first) c.first = o.created_at;
    m.set(k, c);
  }
  return [...m.values()];
}

export default async function Customers({ searchParams }) {
  const sb = serviceClient();
  const sort = ["recent", "orders", "spend"].includes(searchParams.sort) ? searchParams.sort : "recent";
  const q = String(searchParams.q || "").trim().toLowerCase();
  const all = groupCustomers(await loadOrders(sb));
  let list = all.filter((c) => !q || [c.name, c.email, c.phone, c.city].some((v) => String(v || "").toLowerCase().includes(q)));
  list.sort((a, b) => (sort === "orders" ? b.orders - a.orders || b.spend - a.spend : sort === "spend" ? b.spend - a.spend : b.last.localeCompare(a.last)));
  const repeat = all.filter((c) => c.orders >= 2).length;
  return (
    <>
      <h1>Customers</h1><p className="sub">{all.length} customers · {repeat} have ordered more than once. Click a customer to see their full order history.</p>
      <div className="bar-actions">
        {[["recent", "Latest order"], ["orders", "Most orders"], ["spend", "Highest spend"]].map(([k, l]) => <Link key={k} className={"abtn sm " + (k === sort ? "" : "ghost")} href={`?${new URLSearchParams({ sort: k, ...(q ? { q } : {}) })}`}>{l}</Link>)}
        <form style={{ display: "flex", gap: 8 }}><input className="in" style={{ width: 260 }} name="q" defaultValue={q} placeholder="Search name, email, phone, city" /><input type="hidden" name="sort" value={sort} /><button className="abtn sm">Search</button></form>
      </div>
      <div className="tblwrap"><table className="tbl"><thead><tr><th>Customer</th><th>City</th><th>Orders</th><th>Spent</th><th>Prepaid / COD</th><th>Last order</th><th>Contact</th></tr></thead><tbody>
        {list.slice(0, 300).map((c) => <Row key={c.key} href={`/admin/customers/${encodeURIComponent(c.key)}`}>
          <td><b>{c.name || "-"}</b> {c.orders >= 2 && <Pill tone="info">Repeat</Pill>}<br /><span className="mut">{c.email}</span></td>
          <td className="mut">{c.city || "-"}</td><td>{c.orders}{c.cancelled > 0 && <span className="mut"> (+{c.cancelled} cancelled)</span>}</td><td>{inr(c.spend)}</td><td className="mut">{c.online} / {c.cod}</td><td className="mut">{dayFmt(c.last)}</td>
          <td><ContactBtns phone={c.phone} email={c.email} name={c.name} /></td></Row>)}
        {!list.length && <tr><td colSpan="7" className="mut">No customers yet.</td></tr>}
      </tbody></table></div>
    </>
  );
}
