import { serviceClient } from "@/lib/supabase/server";
import ResourceManager from "@/components/admin/ResourceManager";

const fields = [
  { name: "name", label: "Category name", type: "text" },
  { name: "slug", label: "URL slug", type: "text", help: "your-site/categories/<slug>" },
  { name: "description", label: "Short line under the title", type: "textarea", full: true },
  { name: "accent", label: "Pastel accent", type: "color" },
  { name: "image", label: "Tile image", type: "image", folder: "categories", full: true },
  { name: "active", label: "Live", type: "checkbox" },
];
export default async function Page() {
  const { data } = await serviceClient().from("categories").select("*").order("sort_order");
  return <><h1>Categories</h1><p className="sub">Skincare, Hair Care and so on. These drive the home page tiles, the shop filters and the category pages. Use ▲▼ to reorder.</p>
    <ResourceManager table="categories" rows={data || []} fields={fields} sortable blank={{ name: "", slug: "", description: "", accent: "#E5CC85", image: "", active: true }} /></>;
}
