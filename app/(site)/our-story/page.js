import Link from "next/link";
import { Arrow } from "@/components/Media";
export const metadata = { title: "Our story" };
export default function Story() {
  return (
    <div className="page"><div className="wrap" style={{ maxWidth: 860 }}>
      <div className="crumbs"><Link href="/">Home</Link><span>Our story</span></div>
      <h1 className="page-title">Born in India. <em>Built on the street.</em></h1>
      <div className="prose">
        <p>Taeken is an Indian-born streetwear sneaker brand shaped by music, urban culture, movement and individual expression.</p>
        <p>We design sneakers that stand out without trying too hard: bold silhouettes you can wear every day, at a price that doesn't gatekeep your style.</p>
        <h2>What we stand for</h2>
        <ul><li><strong>Distinctive design.</strong> Shapes and details that don't look like everyone else's.</li><li><strong>Everyday wearability.</strong> Built for the commute, the gig, the late night.</li><li><strong>Accessible self-expression.</strong> Make your mark without the premium price tag.</li></ul>
      </div>
      <p style={{ marginTop: 36 }}><Link className="btn" href="/collections/all">Shop the collection <Arrow /></Link></p>
    </div></div>
  );
}
