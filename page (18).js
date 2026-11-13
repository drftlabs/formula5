import { notFound } from "next/navigation";
import { loadProductFormData } from "@/lib/adminData";
import { serviceClient } from "@/lib/supabase/server";
import ProductForm from "@/components/admin/ProductForm";
export default async function EditProduct({ params }) {
  const [{ data: product }, d] = await Promise.all([serviceClient().from("products").select("*").eq("id", params.id).maybeSingle(), loadProductFormData()]);
  if (!product) notFound();
  // make sure every offered size has an entry
  product.sizes = { ...Object.fromEntries(d.sizeKeys.map((s) => [s, 0])), ...(product.sizes || {}) };
  d.sizeKeys = [...new Set([...d.sizeKeys, ...Object.keys(product.sizes)])].sort((a, b) => a - b);
  return <><h1>{product.name}</h1><p className="sub" style={{ marginBottom: 20 }}>Edit product.</p><ProductForm key={product.id} product={product} {...d} /></>;
}
