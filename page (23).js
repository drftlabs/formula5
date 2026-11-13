import { serviceClient } from "@/lib/supabase/server";
import ResourceManager from "@/components/admin/ResourceManager";

const fields = [
  { name: "name", label: "Colour name", type: "text" },
  { name: "hex", label: "Swatch colour", type: "color" },
  { name: "sort_order", label: "Order", type: "number" },
];
export default async function Page() {
  const { data } = await serviceClient().from("colors").select("*").order("sort_order");
  return <><h1>Colours</h1><p className="sub">The colour options you can assign to products. They show as swatches on product cards and pages.</p>
    <ResourceManager table="colors" rows={data || []} fields={fields} preview="color" blank={{ name: "", hex: "#0B0B0B" }} /></>;
}
