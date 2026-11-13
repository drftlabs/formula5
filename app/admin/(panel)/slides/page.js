import { serviceClient } from "@/lib/supabase/server";
import ResourceManager from "@/components/admin/ResourceManager";

const fields = [
  { name: "kicker", label: "Small label", type: "text", help: "e.g. Taeken / Series 001" },
  { name: "title", label: "Headline", type: "text", help: "Use | for a line break: Make your|mark." },
  { name: "cta_text", label: "Button text", type: "text" },
  { name: "link", label: "Button link", type: "text", help: "/collections/all, /products/<slug>, or a full https:// URL" },
  { name: "image", label: "Desktop image", type: "image", folder: "slides", hint: "Wide, about 2400×1400px.", full: true },
  { name: "image_mobile", label: "Mobile image (optional)", type: "image", folder: "slides", hint: "Portrait-ish crop, about 1000×1400px. Falls back to the desktop image.", full: true },
  { name: "position", label: "Image focus (CSS position)", type: "text", help: "e.g. 50% 30%" },
  { name: "active", label: "Slide is live", type: "checkbox" },
];
export default async function Page() {
  const { data } = await serviceClient().from("slides").select("*").order("sort_order");
  return <><h1>Hero slides</h1><p className="sub">The big slider at the top of the homepage. Add as many slides as you like (3 recommended), set each slide's image and where its button goes, and reorder with ▲▼.</p>
    <ResourceManager table="slides" rows={data || []} fields={fields} sortable titleKey="title" blank={{ kicker: "", title: "", cta_text: "Shop now", link: "/collections/all", image: "", image_mobile: "", position: "50% 50%", active: true }} /></>;
}
