import Link from "next/link";
import { serviceClient } from "@/lib/supabase/server";
import ProductTable from "@/components/admin/ProductTable";
import ProductImport from "@/components/admin/ProductImport";

export default async function Products() {
  const sb = serviceClient();
  const [{ data: prods }, { data: cols }, { data: tags }] = await Promise.all([sb.from("products").select("*").order("sort_order").order("created_at", { ascending: false }), sb.from("collections").select("id,name").order("sort_order"), sb.from("tags").select("slug,name,bg,fg").order("sort_order")]);
  return (
    <>
      <h1>Products</h1><p className="sub">Add and edit listings, bulk-change many at once, or import a CSV. Set stock by size in <Link className="link" href="/admin/inventory">Inventory</Link>.</p>
      <div className="bar-actions"><Link className="abtn" href="/admin/products/new">+ New product</Link><Link className="abtn ghost" href="/admin/inventory">Inventory</Link></div>
      <ProductTable products={prods || []} collections={cols || []} tags={tags || []} />
      <h2>Import / export (CSV)</h2><ProductImport />
    </>
  );
}
