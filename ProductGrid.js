"use client";
import ProductCard from "./ProductCard";
// Simple product grid (used by the wishlist and recently viewed).
export default function ProductGrid({ products }) {
  return <div className="f5-grid">{products.map((p) => <ProductCard key={p.id} p={p} />)}</div>;
}
