import { loadProductFormData } from "@/lib/adminData";
import ProductForm from "@/components/admin/ProductForm";
export default async function NewProduct() {
  const d = await loadProductFormData();
  return <><h1>New product</h1><p className="sub" style={{ marginBottom: 20 }}>Fill in the details, upload images, set stock.</p><ProductForm {...d} /></>;
}
