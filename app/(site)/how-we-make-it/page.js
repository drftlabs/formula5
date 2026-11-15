import Link from "next/link";
import { getSettings } from "@/lib/data";
import { Arrow } from "@/components/Media";
export const metadata = { title: "How we make it", description: "How Formula 5 formulates, labels and ships: one hero active per product, stated with its percentage, and the full ingredient list on every page." };
export const dynamic = "force-dynamic";
const real = (v) => typeof v === "string" && v.trim() && !/\[[^\]]*\]/.test(v);

// Plain facts only. Add your manufacturer / packer details in Admin > Settings and they appear here.
export default async function HowWeMakeIt() {
  const s = await getSettings();
  const maker = real(s.manufacturer) ? s.manufacturer.trim() : "";
  return (
    <div className="page"><div className="wrap" style={{ maxWidth: 860 }}>
      <div className="crumbs"><Link href="/">Home</Link><span>How we make it</span></div>
      <h1 className="page-title">How we make it. <em>In plain words.</em></h1>
      <div className="prose">
        <h2>One hero active, one number</h2>
        <p>Every Formula 5 product is built around a single hero active, and its percentage or strength is in the product name. If it says 10% L-Ascorbic Acid, that is what the formula is designed around.</p>
        <h2>The full ingredient list, every time</h2>
        <p>Each product page carries the complete ingredient list and the top ingredients in order, so you can check what you are buying before you buy it.</p>
        <h2>Clear directions</h2>
        <p>How to use, how often, and who it is for are written on the page in simple language. If you are pregnant, nursing, on medication or have a skin or health condition, speak to your doctor before starting any new product.</p>
        <h2>No miracle promises</h2>
        <p>We do not claim to diagnose, treat, cure or prevent any disease. Results vary from person to person, so judge a product by using it regularly.</p>
        {maker && <><h2>Manufacturer details</h2><p style={{ whiteSpace: "pre-line" }}>{maker}</p></>}
        <h2>Delivery and care after you order</h2>
        <p>Orders are dispatched in {s.dispatch_days || "1\u20132 business days"} and usually arrive in {s.delivery_days || "3\u20135 business days"}. Read our <Link href="/policies/shipping">shipping policy</Link> and <Link href="/policies/refund">refund and cancellation policy</Link>, or <Link href="/contact">contact us</Link> any time.</p>
      </div>
      <p style={{ marginTop: 36 }}><Link className="btn" href="/products">Shop all products <Arrow /></Link></p>
    </div></div>
  );
}
