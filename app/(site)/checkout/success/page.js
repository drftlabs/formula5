import Link from "next/link";
import ClearCart from "@/components/ClearCart";
import TrackOpen from "@/components/TrackOpen";
import OrderSummary from "@/components/OrderSummary";
import PixelEvent from "@/components/PixelEvent";
import { Arrow } from "@/components/Media";
import { getSettings } from "@/lib/data";
import { etaRange, inr } from "@/lib/format";
import { shippingCfg } from "@/lib/pricing";

export const metadata = { title: "Order confirmed", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Success({ searchParams }) {
  const settings = await getSettings(), cfg = shippingCfg(settings);
  const due = Math.max(0, parseInt(searchParams.due) || 0), total = Math.max(0, parseInt(searchParams.v) || 0);
  const o = String(searchParams.o || "").replace(/[^A-Za-z0-9-]/g, "").slice(0, 20);
  const cod = searchParams.m === "cod" || due > 0, wa = searchParams.w === "1";
  const steps = [
    ["Confirmed", "We have your order and a confirmation email is on its way."],
    ["Packed", `Packed and handed to the courier within ${settings.dispatch_days || "1–2 business days"}.`],
    ["On the way", "You get the courier name and a tracking link by email."],
    ["Delivered", `Expected ${etaRange(cfg.etaMin, cfg.etaMax)}.`],
  ];
  return (
    <div className="page ok-page"><ClearCart />
      {o && total > 0 && <PixelEvent event="Purchase" data={{ value: total, currency: "INR", content_type: "product", order_id: o }} eventId={"purchase-" + o} once={o} />}
      <div className="wrap" style={{ maxWidth: 760 }}>
        <div className="ok-hero center">
          <span className="stamp" aria-hidden="true">決</span>
          <p className="eyebrow" style={{ justifyContent: "center" }}>Thank you</p>
          <h1 className="page-title">Order <em>confirmed</em></h1>
          <p className="lead">Your pair is locked in. Make your mark.</p>
        </div>
        <div className="ok-card">
          <div className="ok-row"><span>Order number</span><b className="ok-num">{o || "Check your email"}</b></div>
          <div className="ok-row"><span>Payment type</span><b>{cod ? (total > 0 && due >= total ? "Cash on delivery" : "Cash on delivery (part-paid online)") : "Paid online (Razorpay)"}</b></div>
          {wa && <div className="ok-row paid"><span>Phone</span><b>✓ Verified on WhatsApp</b></div>}
          {total > 0 && <div className="ok-row"><span>Total order value</span><b>{inr(total)}</b></div>}
          {total > due && <div className="ok-row paid"><span>Payment done</span><b>{inr(Math.max(0, total - due))}</b></div>}
          <div className={"ok-row " + (due > 0 ? "cod" : "paid")}><span>{due > 0 ? "Pending: pay on delivery" : "Pending"}</span><b>{due > 0 ? inr(due) : "₹0, fully paid"}</b></div>
          <div className="ok-row"><span>Estimated delivery</span><b>{etaRange(cfg.etaMin, cfg.etaMax)}</b></div>
        </div>
        <OrderSummary order={o} />
        {cod && due > 0 && <p className="ok-note">{total > due ? "Your advance is paid. " : ""}Please keep <b>{inr(due)}</b> ready for the delivery partner. We will call you only if the address needs a quick check.</p>}
        <ol className="ok-steps">{steps.map(([t, d], i) => <li key={t} className={i === 0 ? "on" : ""}><i>{i + 1}</i><div><b>{t}</b><span>{d}</span></div></li>)}</ol>
        <div className="ok-actions">
          {o && <TrackOpen className="btn" order={o}>Track this order <Arrow /></TrackOpen>}
          <Link className="btn ghost" href="/account">My orders</Link>
          <Link className="btn ghost" href="/collections/all">Keep shopping</Link>
        </div>
        <p className="ok-help">Need help? {settings.whatsapp ? <><a href={`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent("Hi Taeken, about order " + o)}`} target="_blank" rel="noopener">WhatsApp us</a> or </> : null}<Link href="/contact">contact us</Link>. {cfg.returnDays}-day returns and {cfg.exchangeDays}-day size exchange apply.</p>
      </div>
    </div>
  );
}
