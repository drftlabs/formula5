"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { browserClient } from "@/lib/supabase/client";

const NAV = [
  ["Overview", [["/admin", "Dashboard", "dashboard"], ["/admin/analytics", "Traffic & analytics", "analytics"]]],
  ["Sales", [["/admin/orders", "Orders", "orders"], ["/admin/customers", "Customers", "customers"], ["/admin/abandoned", "Abandoned carts", "abandoned"], ["/admin/discounts", "Discount codes", "discounts"], ["/admin/messages", "Messages & complaints", "messages"]]],
  ["Catalogue", [["/admin/products", "Products", "products"], ["/admin/inventory", "Inventory", "inventory"], ["/admin/media", "Bulk photos", "media"], ["/admin/collections", "Collections", "collections"], ["/admin/tags", "Tags", "tags"], ["/admin/colors", "Colours", "colors"]]],
  ["Homepage", [["/admin/blocks", "Block placement", "blocks"], ["/admin/slides", "Hero slides", "slides"]]],
  ["Site", [["/admin/pages", "Legal pages", "pages"], ["/admin/settings", "Settings", "settings"]]],
];
export default function AdminNav({ label, perms = [] }) {
  const path = usePathname(), router = useRouter();
  const on = (h) => (h === "/admin" ? path === h : path.startsWith(h));
  return (
    <aside className="adm-side">
      <div className="brand"><img src="/logo.png" alt="" /><div>FORMULA 5<small>ADMIN</small></div></div>
      {NAV.map(([g, links]) => { const ok = links.filter((l) => perms.includes(l[2])); return ok.length ? <div key={g}><div className="grp">{g}</div>{ok.map(([h, l]) => <Link key={h} href={h} className={on(h) ? "on" : ""}>{l}</Link>)}</div> : null; })}
      <div className="grp">Account</div>
      <a href="/" target="_blank" rel="noopener">View store ↗</a>
      <button onClick={async () => { await browserClient().auth.signOut(); router.replace("/admin/login"); router.refresh(); }}>Sign out<br /><span style={{ fontSize: 10, color: "#8a8a8f", fontWeight: 500 }}>{label}</span></button>
    </aside>
  );
}
