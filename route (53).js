import { NextResponse } from "next/server";
import { getProducts, getColors } from "@/lib/data";

export const dynamic = "force-dynamic";

// Public product data for "Recently viewed": /api/products?slugs=a,b,c  (same data the storefront already shows)
export async function GET(req) {
  const slugs = (new URL(req.url).searchParams.get("slugs") || "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 8);
  if (!slugs.length) return NextResponse.json({ products: [], colors: [] });
  const [all, colors] = await Promise.all([getProducts(), getColors()]);
  const products = slugs.map((s) => all.find((p) => p.slug === s)).filter(Boolean);
  return NextResponse.json({ products, colors });
}
