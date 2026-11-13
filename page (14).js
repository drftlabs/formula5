import { serviceClient } from "@/lib/supabase/server";
import ResourceManager from "@/components/admin/ResourceManager";

const base = [{ name: "title", label: "Admin label", type: "text", help: "Only you see this." }, { name: "enabled", label: "Show on homepage", type: "checkbox" }];
const makeFields = (products) => ({
  hero: [...base],
  products: [...base,
    { name: "config.eyebrow", label: "Small heading", type: "text" }, { name: "config.title", label: "Heading", type: "text", help: "Use | for a line break; the last line is highlighted." },
    { name: "config.source", label: "Which products", type: "select", options: [["all", "All products"], ["tag", "Only a tag"], ["collection", "Only a collection"], ["pick", "Hand-picked: I choose which products and in what order"]] },
    { name: "config.source_value", label: "Tag or collection slug", type: "text", help: "e.g. bestseller, new, or a collection slug (needed if you chose Tag/Collection)" },
    { name: "config.product_ids", label: "Hand-picked products (used when “Which products” = Hand-picked)", type: "productpick", products, full: true },
    { name: "config.limit", label: "Max products", type: "number", help: "Ignored for hand-picked." },
    { name: "config.rows", label: "Rows shown before the blurred “View all”", type: "number", help: "Each row is 2 products on a phone (2 = a 2×2 grid), 4 on desktop. 0 = show all products, no “View all”." }],
  banner: [...base,
    { name: "config.variant", label: "Style", type: "select", options: [["campaign", "Text bottom-right"], ["next", "Text bottom-left"]] },
    { name: "config.plate", label: "Small number (optional)", type: "text", help: "e.g. 01" }, { name: "config.kicker", label: "Small label", type: "text" },
    { name: "config.title", label: "Headline", type: "text", help: "Use | for a line break." }, { name: "config.cta_text", label: "Button text", type: "text" }, { name: "config.link", label: "Button link", type: "text" },
    { name: "config.image", label: "Desktop image", type: "image", folder: "banners", hint: "Wide, about 2400×1200px.", full: true },
    { name: "config.image_mobile", label: "Mobile image (optional)", type: "image", folder: "banners", full: true }, { name: "config.fit", label: "Image fit", type: "select", options: [["cover", "Fill the banner (crops edges)"], ["contain", "Show the whole image (good for 1:1 / square)"]] }, { name: "config.position", label: "Image focus", type: "text" }],
  image: [...base,
    { name: "config.image", label: "Large image", type: "image", folder: "banners", hint: "Any size or shape. Use 1:1 or wide, it will fit.", full: true },
    { name: "config.image_mobile", label: "Mobile image (optional)", type: "image", folder: "banners", full: true },
    { name: "config.fit", label: "Image fit", type: "select", options: [["contain", "Show the whole image (good for 1:1 / any shape)"], ["cover", "Fill a wide strip (crops edges)"]] },
    { name: "config.caption", label: "Caption (optional)", type: "text" }, { name: "config.link", label: "Link when tapped (optional)", type: "text" }, { name: "config.alt", label: "Image description (for accessibility)", type: "text" }],
  categories: [...base, { name: "config.eyebrow", label: "Small heading", type: "text" }, { name: "config.title", label: "Heading", type: "text" }],
  concerns: [...base, { name: "config.eyebrow", label: "Small heading", type: "text" }, { name: "config.title", label: "Heading", type: "text" }],
  routine: [...base, { name: "config.eyebrow", label: "Small heading", type: "text" }, { name: "config.title", label: "Heading", type: "text", help: "Use | for a line break." }, { name: "config.text", label: "Paragraph", type: "textarea", full: true }],
  editorial: [...base, { name: "config.eyebrow", label: "Small heading", type: "text" }, { name: "config.title", label: "Heading", type: "text", help: "Use | for a line break." }, { name: "config.text", label: "Paragraph", type: "textarea", full: true }],
  why: [...base, { name: "config.eyebrow", label: "Small heading", type: "text" }, { name: "config.title", label: "Heading", type: "text" }],
  testimonials: [...base, { name: "config.eyebrow", label: "Small heading", type: "text" }, { name: "config.title", label: "Heading", type: "text" }],
  newsletter: [...base, { name: "config.eyebrow", label: "Small heading", type: "text" }, { name: "config.title", label: "Heading", type: "text" }, { name: "config.text", label: "Paragraph", type: "textarea", full: true }],
  collections: [...base, { name: "config.eyebrow", label: "Small heading", type: "text" }, { name: "config.title", label: "Heading", type: "text" }, { name: "__note", label: "", type: "text" }],
  story: [...base,
    { name: "config.eyebrow", label: "Small heading", type: "text" }, { name: "config.title", label: "Heading", type: "text", help: "Use | for a line break." },
    { name: "config.text", label: "Paragraph", type: "textarea", full: true }, { name: "config.link_text", label: "Link text", type: "text" }, { name: "config.link", label: "Link", type: "text" },
    { name: "config.image", label: "Image", type: "image", folder: "story", full: true }, { name: "config.position", label: "Image focus", type: "text" }],
});

export default async function Page() {
  const sb = serviceClient();
  const [{ data }, { data: prods }] = await Promise.all([sb.from("blocks").select("*").order("sort_order"), sb.from("products").select("id,name,images,active").order("name")]);
  const fieldsByType = makeFields((prods || []).map((p) => ({ id: p.id, name: p.name + (p.active ? "" : " (hidden)"), img: p.images?.[0] || "" })));
  fieldsByType.collections = fieldsByType.collections.filter((f) => f.name !== "__note");
  return <><h1>Block placement</h1><p className="sub">Control the homepage layout. Use ▲▼ to place each block higher or lower, switch blocks on/off, and edit their text and images. You can add extra product rows (for example a “Bestsellers” strip filtered by tag) or more banners.</p>
    <ResourceManager table="blocks" rows={data || []} fieldsByType={fieldsByType} sortable titleKey="title"
      newTypes={[["products", "Product row"], ["banner", "Banner"], ["image", "Large image"], ["categories", "Category tiles"], ["concerns", "Concern tiles"], ["routine", "Routine finder"], ["editorial", "Editorial"], ["why", "Why us"], ["testimonials", "Reviews"], ["newsletter", "Newsletter"], ["hero", "Hero slider"]]} blank={{ enabled: true }} /></>;
}
