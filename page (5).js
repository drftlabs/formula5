import { serviceClient } from "@/lib/supabase/server";
import ResourceManager from "@/components/admin/ResourceManager";

const fields = [
  { name: "product_slug", label: "Product slug", type: "text", help: "Must match the product's URL slug." },
  { name: "name", label: "Reviewer name", type: "text" },
  { name: "rating", label: "Rating (1 to 5)", type: "number" },
  { name: "title", label: "Title", type: "text" },
  { name: "body", label: "Review", type: "textarea", full: true },
  { name: "verified", label: "Verified buyer", type: "checkbox" },
  { name: "approved", label: "Approved (shown on the store)", type: "checkbox" },
  { name: "featured", label: "Featured on the home page", type: "checkbox" },
];
export default async function Page() {
  const { data } = await serviceClient().from("reviews").select("*").order("created_at", { ascending: false }).limit(300);
  return <><h1>Reviews</h1><p className="sub">Only approved reviews appear on the store. Add only real customer reviews. Nothing here is shown until you tick Approved.</p>
    <ResourceManager table="reviews" rows={data || []} fields={fields} titleKey="name" blank={{ product_slug: "", name: "", rating: 5, title: "", body: "", verified: false, approved: false, featured: false }} /></>;
}
