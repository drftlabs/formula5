import { serviceClient } from "@/lib/supabase/server";
import ResourceManager from "@/components/admin/ResourceManager";

const fields = [
  { name: "kicker", label: "Small label", type: "text", help: "e.g. New · Bestseller" },
  { name: "title", label: "Headline", type: "text", help: "Use | for a line break: Make your|mark." },
  { name: "subtext", label: "Supporting line", type: "textarea", full: true },
  { name: "cta_text", label: "Button text", type: "text" },
  { name: "link", label: "Button link", type: "text", help: "/products, /categories/<slug>, /products/<slug>, or a full https:// URL" },
  { name: "cta2_text", label: "Second button text (optional)", type: "text" },
  { name: "cta2_link", label: "Second button link", type: "text" },
  { name: "accent", label: "Pastel accent", type: "color" },
  { name: "image", label: "Desktop image", type: "image", folder: "slides", hint: "Wide, about 2400×1400px.", full: true },
  { name: "image_mobile", label: "Mobile image (optional)", type: "image", folder: "slides", hint: "Portrait-ish crop, about 1000×1400px. Falls back to the desktop image.", full: true },
  { name: "position", label: "Image focus (CSS position)", type: "text", help: "e.g. 50% 30%" },
  { name: "active", label: "Slide is live", type: "checkbox" },
];
export default async function Page() {
  const { data } = await serviceClient().from("slides").select("*").order("sort_order");
  return <><h1>Hero slides</h1><p className="sub">The big slider at the top of the homepage. Add as many slides as you like (3 recommended), set each slide's image and where its button goes, and reorder with ▲▼.</p>
    <ResourceManager table="slides" rows={data || []} fields={fields} sortable titleKey="title" blank={{ kicker: "", title: "", subtext: "", cta_text: "Shop now", link: "/products", cta2_text: "", cta2_link: "", accent: "#E5CC85", image: "", image_mobile: "", position: "50% 50%", active: true }} /></>;
}
