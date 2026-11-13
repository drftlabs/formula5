import { serviceClient } from "@/lib/supabase/server";
import ResourceManager from "@/components/admin/ResourceManager";

const fields = [
  { name: "code", label: "Code", type: "text", help: "Customers type this at checkout, e.g. WELCOME10. Letters and numbers only." },
  { name: "type", label: "Type", type: "select", options: [["percent", "Percent off"], ["flat", "Flat ₹ off"]] },
  { name: "value", label: "Value (% or ₹)", type: "number" },
  { name: "min_order", label: "Minimum order (₹)", type: "number", help: "0 = no minimum." },
  { name: "max_uses", label: "Max uses (blank = unlimited)", type: "number" },
  { name: "expires_at", label: "Expires on (YYYY-MM-DD, blank = never)", type: "text" },
  { name: "active", label: "Code is live", type: "checkbox" },
];
export default async function Page() {
  const { data } = await serviceClient().from("discounts").select("*").order("created_at", { ascending: false });
  const rows = (data || []).map((d) => ({ ...d, expires_at: d.expires_at ? String(d.expires_at).slice(0, 10) : "" }));
  return <><h1>Discount codes</h1><p className="sub">Create codes for launches, influencers or abandoned buyers. Each shows how many times it's been used.</p>
    <div className="tblwrap" style={{ marginBottom: 20 }}><table className="tbl"><thead><tr><th>Code</th><th>Discount</th><th>Min order</th><th>Used</th><th>Status</th></tr></thead><tbody>
      {rows.map((d) => <tr key={d.id}><td><b>{d.code}</b></td><td>{d.type === "percent" ? `${d.value}%` : `₹${d.value}`}</td><td>{d.min_order ? `₹${d.min_order}` : "-"}</td><td>{d.used}{d.max_uses != null ? ` / ${d.max_uses}` : ""}</td><td>{d.active ? "Live" : <span className="mut">Off</span>}</td></tr>)}
      {!rows.length && <tr><td colSpan="5" className="mut">No codes yet.</td></tr>}
    </tbody></table></div>
    <ResourceManager table="discounts" rows={rows} fields={fields} titleKey="code" blank={{ code: "", type: "percent", value: 10, min_order: 0, max_uses: "", expires_at: "", active: true }} /></>;
}
