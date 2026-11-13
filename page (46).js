import Link from "next/link";
import { Arrow } from "@/components/Media";
export const metadata = { title: "Our story", description: "Formula 5: precision, purity and performance. One hero active in every product, stated with its percentage." };
export default function Story() {
  return (
    <div className="page"><div className="wrap" style={{ maxWidth: 860 }}>
      <div className="crumbs"><Link href="/">Home</Link><span>Our story</span></div>
      <h1 className="page-title">Say what's inside. <em>Say how much.</em></h1>
      <div className="prose">
        <p>Formula 5 makes skincare, hair care and daily supplements around one simple idea: every product has one hero active, and its percentage is stated up front.</p>
        <p>No vague promises, no long lists of buzzwords. Just a clear formula, a plain description of what it is for, and the full ingredient list on every product page.</p>
        <h2>What we stand for</h2>
        <ul><li><strong>Precision.</strong> One hero active per product, with the percentage on the pack.</li><li><strong>Purity.</strong> Clean, simple presentation and the full ingredient list, always.</li><li><strong>Performance.</strong> Products designed for a regular routine you can judge for yourself.</li></ul>
      </div>
      <p style={{ marginTop: 36 }}><Link className="btn" href="/products">Shop all products <Arrow /></Link></p>
    </div></div>
  );
}
