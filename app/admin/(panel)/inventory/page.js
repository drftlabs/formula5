import { serviceClient } from "@/lib/supabase/server";
import { loadProductFormData } from "@/lib/adminData";
import InventoryTable from "@/components/admin/InventoryTable";

export default async function Inventory() {
  const [{ data: prods }, d] = await Promise.all([serviceClient().from("products").select("id,name,sku,sizes,low_stock").order("name"), loadProductFormData()]);
  const keys = [...new Set([...d.sizeKeys, ...(prods || []).flatMap((p) => Object.keys(p.sizes || {}))])].sort((a, b) => a - b);
  return <><h1>Inventory</h1><p className="sub">Stock for every pair, by UK size, on one screen. Stock drops automatically when an order is paid.</p><InventoryTable products={prods || []} sizeKeys={keys} /></>;
}
