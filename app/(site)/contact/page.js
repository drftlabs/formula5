import Link from "next/link";
import MessageForm from "@/components/MessageForm";
import { getSettings } from "@/lib/data";
export const metadata = { title: "Contact us" };
export const dynamic = "force-dynamic";
export default async function Contact() {
  const s = await getSettings();
  return (
    <div className="page"><div className="wrap" style={{ maxWidth: 900 }}>
      <div className="crumbs"><Link href="/">Home</Link><span>Contact</span></div>
      <h1 className="page-title">Contact <em>us</em></h1>
      <p className="lead">Questions about sizing, an order or a drop? Send a message and we'll reply by email.</p>
      <div className="co" style={{ gridTemplateColumns: "minmax(0,1.3fr) minmax(0,.7fr)" }}>
        <MessageForm type="contact" />
        <div className="prose" style={{ fontSize: 15 }}>
          <h2 style={{ marginTop: 0 }}>Reach us</h2>
          <p><strong>Email</strong><br />{s.contact_email}</p>
          {s.contact_phone && <p><strong>Phone</strong><br />{s.contact_phone}</p>}
          {s.address && <p><strong>Address</strong><br />{s.address}</p>}
          <p>Have a problem with an order? <Link className="link" href="/complaint">Raise a complaint</Link></p>
          <p><Link className="link" href="/track">Track an order</Link></p>
        </div>
      </div>
    </div></div>
  );
}
