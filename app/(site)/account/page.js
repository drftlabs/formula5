import Link from "next/link";
import { redirect } from "next/navigation";
import { sessionClient } from "@/lib/supabase/server";
import { getProducts, getColors } from "@/lib/data";
import ProductGrid from "@/components/ProductGrid";
import SignOut from "@/components/SignOut";
import { inr, dayFmt, STATUS, STEPS } from "@/lib/format";

export const metadata = { title: "My account", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Account() {
  const sb = sessionClient();
  if (!sb) redirect("/account/login");
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/account/login");
  const { data: orders } = await sb.from("orders").select("*").neq("status", "pending_payment").order("created_at", { ascending: false });
  const { data: wl } = await sb.from("wishlist").select("product_id").eq("user_id", user.id);
  const ids = (wl || []).map((w) => w.product_id);
  const [saved, colors] = await Promise.all([ids.length ? getProducts({ ids }) : [], getColors()]);
  return (
    <div className="page"><div className="wrap">
      <div className="acct-head"><div><p className="eyebrow">My account</p><h1 className="page-title">Your <em>orders</em></h1><p className="lead" style={{ marginBottom: 0 }}>{user.email}</p></div><SignOut /></div>
      {!orders?.length ? <p className="empty-state">No orders yet. <Link className="link" href="/collections/all">Start shopping</Link></p> : (
        <div className="orders">
          {orders.map((o) => {
            const idx = STEPS.indexOf(o.status === "paid" ? "paid" : o.status);
            return (
              <article className="order" key={o.id}>
                <div className="order-top"><div><b>{o.order_number}</b><div style={{ fontSize: 12, color: "var(--concrete)", marginTop: 4 }}>{dayFmt(o.created_at)} · {inr(o.total)}</div></div><span className={"badge " + o.status}>{STATUS[o.status]}</span></div>
                {idx >= 0 && <div className="steps" aria-label="Order progress">{STEPS.map((s, i) => <div key={s} className={i <= idx ? "on" : ""}>{STATUS[s]}</div>)}</div>}
                <div className="o-items">{o.items.map((i, k) => <div key={k}>{i.name} · UK {i.size} × {i.qty}</div>)}</div>
                {o.tracking_number && <div className="track"><b>Tracking</b><br />{o.courier || "Courier"}: {o.tracking_number}{o.tracking_url && <> · <a href={o.tracking_url} target="_blank" rel="noopener">Track package</a></>}</div>}
              </article>
            );
          })}
        </div>
      )}
      <section className="wl"><div className="sec-head"><div><p className="eyebrow">Saved</p><h2 className="h2">Your <em>wishlist</em></h2></div></div>
        {saved.length ? <ProductGrid products={saved} colors={colors} collapse={false} /> : <p className="empty-state">Tap the heart on any pair to save it here.</p>}
      </section>
    </div></div>
  );
}
