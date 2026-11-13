import Link from "next/link";
import CheckoutForm from "@/components/CheckoutForm";
export const metadata = { title: "Checkout", robots: { index: false } };
export default function Checkout() {
  return <div className="page"><div className="wrap"><div className="crumbs"><Link href="/">Home</Link><span>Checkout</span></div><h1 className="page-title">Check<em>out</em></h1><CheckoutForm /></div></div>;
}
