import { getAdmin } from "@/lib/admin";
import { serviceClient } from "@/lib/supabase/server";
import { toCSV } from "@/lib/csv";
import { SETTINGS } from "@/lib/fallback";
import { mergeSizes } from "@/lib/format";

export const dynamic = "force-dynamic";

// GET /admin/products/export            -> all products as CSV
// GET /admin/products/export?template=1 -> just the header + one example row
export async function GET(req) {
  if (!(await getAdmin())) return new Response("Unauthorized", { status: 401 });
  const sb = serviceClient(); const template = new URL(req.url).searchParams.get("template");
  const [{ data: prods }, { data: cols }, { data: st }] = await Promise.all([sb.from("products").select("*").order("sort_order"), sb.from("collections").select("id,slug"), sb.from("site_settings").select("value").eq("key", "site").maybeSingle()]);
  const sizeKeys = mergeSizes(st?.value?.sizes || SETTINGS.sizes);
  const cs = Object.fromEntries((cols || []).map((c) => [c.id, c.slug]));
  const nImg = Math.max(5, ...(prods || []).map((p) => (p.images || []).length));
  const imgCols = Array.from({ length: nImg }, (_, i) => "image_" + (i + 1));
  const head = ["name", "slug", "sku", "price", "compare_price", "cost_price", "description", "long_description", "details", ...imgCols, "colors", "tags", "collections", "vendor", "product_type", "barcode", "weight_g", "active", "featured", "low_stock", "seo_title", "seo_description", ...sizeKeys.map((s) => "size_" + s)];
  const rows = template
    ? [{ name: "Example Product", slug: "example-product", sku: "F5-001", price: 1999, compare_price: 2499, cost_price: 900, description: "One line about the product", details: "Key active: 10% Vitamin C||Size: 100 ml", image_1: "https://example.com/front.png", image_2: "https://example.com/side.png", colors: "obsidian|chalk", tags: "new-drop", collections: "skincare-set", vendor: "Formula 5", active: "true", low_stock: 3, ...Object.fromEntries(sizeKeys.map((s) => ["size_" + s, 5])) }]
    : (prods || []).map((p) => ({ ...p, details: String(p.details || "").split("\n").filter(Boolean).join("||"), ...Object.fromEntries(imgCols.map((c, i) => [c, (p.images || [])[i] || ""])), colors: (p.colors || []).join("|"), tags: (p.tags || []).join("|"), collections: (p.collection_ids?.length ? p.collection_ids : p.collection_id ? [p.collection_id] : []).map((i) => cs[i]).filter(Boolean).join("|"), ...Object.fromEntries(sizeKeys.map((s) => ["size_" + s, p.sizes?.[s] ?? 0])) }));
  return new Response(toCSV(rows, head), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="formula5-products-${template ? "template" : new Date().toISOString().slice(0, 10)}.csv"` } });
}
