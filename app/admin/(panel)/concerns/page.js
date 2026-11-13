import { serviceClient } from "@/lib/supabase/server";
import ResourceManager from "@/components/admin/ResourceManager";

const fields = [
  { name: "name", label: "Concern name", type: "text" },
  { name: "slug", label: "URL slug", type: "text", help: "your-site/concerns/<slug>" },
  { name: "icon", label: "Icon", type: "text", help: "hair, glow, eye, drop, bolt or wave" },
  { name: "accent", label: "Pastel accent", type: "color" },
  { name: "active", label: "Live", type: "checkbox" },
];
export default async function Page() {
  const { data } = await serviceClient().from("concerns").select("*").order("sort_order");
  return <><h1>Concerns</h1><p className="sub">“Shop by concern” groups. Assign them to products in the product form.</p>
    <ResourceManager table="concerns" rows={data || []} fields={fields} sortable blank={{ name: "", slug: "", icon: "glow", accent: "#E4BC9C", active: true }} /></>;
}
