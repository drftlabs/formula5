import Link from "next/link";
import { notFound } from "next/navigation";
import { serviceClient } from "@/lib/supabase/server";
import CollectionProducts from "@/components/admin/CollectionProducts";

export default async function CollectionProductsPage({ params }) {
  const sb = serviceClient();
  const [{ data: c }, { data: prods }] = await Promise.all([sb.from("collections").select("id,name,slug").eq("id", params.id).maybeSingle(), sb.from("products").select("id,name,images,active,collection_id,collection_ids").order("name")]);
  if (!c) notFound();
  const selected = (prods || []).filter((p) => p.collection_ids?.includes(c.id) || p.collection_id === c.id).map((p) => p.id);
  return <><p className="mut"><Link href="/admin/collections">← Collections</Link></p><h1>{c.name}: products</h1><p className="sub">Tick the products that belong in this collection. A product can be in several collections.</p><CollectionProducts collection={c} products={prods || []} selected={selected} /></>;
}
