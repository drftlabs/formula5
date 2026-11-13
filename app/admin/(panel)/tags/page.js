import { serviceClient } from "@/lib/supabase/server";
import ResourceManager from "@/components/admin/ResourceManager";

const fields = [
  { name: "name", label: "Tag text", type: "text", help: "e.g. New Drop, Bestseller, Limited, Sale" },
  { name: "bg", label: "Background colour", type: "color" },
  { name: "fg", label: "Text colour", type: "color" },
  { name: "sort_order", label: "Order", type: "number" },
];
export default async function Page() {
  const { data } = await serviceClient().from("tags").select("*").order("sort_order");
  return <><h1>Tags</h1><p className="sub">Create labels like “New Drop” or “Bestseller”, choose their colours, then tick them on each product. They appear on product cards and product pages.</p>
    <ResourceManager table="tags" rows={data || []} fields={fields} preview="tag" blank={{ name: "", bg: "#A8812F", fg: "#FFFFFF" }} /></>;
}
