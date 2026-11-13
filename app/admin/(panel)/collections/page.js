import { serviceClient } from "@/lib/supabase/server";
import Link from "next/link";
import ResourceManager from "@/components/admin/ResourceManager";

const fields = [
  { name: "name", label: "Collection name", type: "text", help: "Rename any time. The page URL stays the same unless you change the slug." },
  { name: "slug", label: "URL slug", type: "text", help: "taeken.in/collections/<slug>" },
  { name: "kanji", label: "Kanji accent (optional)", type: "text", help: "One character shown on the tile, e.g. 高" },
  { name: "image", label: "Tile image", type: "image", folder: "collections", hint: "Portrait or square photo, about 1200px wide.", full: true },
  { name: "position", label: "Image focus (CSS position)", type: "text", help: "e.g. 50% 30% to keep the top of the photo visible" },
  { name: "show_home", label: "Show on homepage", type: "checkbox" },
  { name: "active", label: "Collection is live", type: "checkbox" },
];
export default async function Page() {
  const sb = serviceClient();
  const [{ data }, { data: prods }] = await Promise.all([sb.from("collections").select("*").order("sort_order"), sb.from("products").select("collection_id,collection_ids")]);
  const count = (id) => (prods || []).filter((p) => p.collection_ids?.includes(id) || p.collection_id === id).length;
  return <><h1>Collections</h1><p className="sub">These are the “Pick your shape” tiles. Change names and images here and they update on the homepage, footer and collection pages. Use ▲▼ to reorder.</p>
    <div className="tblwrap" style={{ marginBottom: 22 }}><table className="tbl"><thead><tr><th>Collection</th><th>Products</th><th></th></tr></thead><tbody>{(data || []).map((c) => <tr key={c.id}><td><b>{c.name}</b> <span className="mut">/{c.slug}</span></td><td>{count(c.id)}</td><td><Link className="abtn sm" href={`/admin/collections/${c.id}`}>Manage products →</Link></td></tr>)}</tbody></table></div>
    <h2>Names, images &amp; order</h2>
    <ResourceManager table="collections" rows={data || []} fields={fields} sortable blank={{ name: "", slug: "", kanji: "", image: "", position: "50% 50%", show_home: true, active: true }} /></>;
}
