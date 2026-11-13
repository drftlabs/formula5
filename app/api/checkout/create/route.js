import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { serviceClient, sessionClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/data";
import { priceOrder, shippingCfg, checkDiscount } from "@/lib/pricing";
import { markPaid } from "@/lib/orders";

export const dynamic = "force-dynamic";
const clean = (v, n = 200) => String(v ?? "").trim().slice(0, n);

// Step 1 of checkout: re-price the bag from the DATABASE (never trust browser prices), save the order,
// then create a Razorpay order for what must be paid NOW (full amount for online, 10% for COD).
export async function POST(req) {
  const sb = serviceClient();
  if (!sb) return NextResponse.json({ error: "The store backend isn't connected yet." }, { status: 503 });
  let body; try { body = await req.json(); } catch { return NextResponse.json({ error: "Bad request" }, { status: 400 }); }
  const c = body.customer || {}, a = body.address || {};
  const customer = { name: clean(c.name, 120), email: clean(c.email).toLowerCase(), phone: clean(c.phone, 15).replace(/[^\d+]/g, "") };
  const address = { line1: clean(a.line1), line2: clean(a.line2), area: clean(a.area, 80), city: clean(a.city, 80), state: clean(a.state, 60), pin: clean(a.pin, 6) };
  if (!customer.name || !/^\S+@\S+\.\S+$/.test(customer.email) || customer.phone.replace(/\D/g, "").length < 10) return NextResponse.json({ error: "Please enter your name, a valid email and a 10-digit phone number." }, { status: 400 });
  if (!address.line1 || !address.city || !address.state || !/^\d{6}$/.test(address.pin)) return NextResponse.json({ error: "Please complete your delivery address (6-digit pin code)." }, { status: 400 });
  const req_items = Array.isArray(body.items) ? body.items.slice(0, 30) : [];
  if (!req_items.length) return NextResponse.json({ error: "Your bag is empty." }, { status: 400 });

  const s = await getSettings(), cfg = shippingCfg(s);
  const method = body.method === "cod" ? "cod" : "online";
  if (method === "cod" && !cfg.codEnabled) return NextResponse.json({ error: "Cash on delivery isn't available right now." }, { status: 400 });
  if (method === "online" && (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET)) return NextResponse.json({ error: "Online payments are not configured yet." }, { status: 503 });

  const ids = [...new Set(req_items.map((i) => i.id))];
  const { data: prods } = await sb.from("products").select("id,name,price,packs,images,sizes,active,colors").in("id", ids);
  const byId = Object.fromEntries((prods || []).map((p) => [p.id, p]));
  const { data: cl } = await sb.from("colors").select("slug,name");
  const cname = Object.fromEntries((cl || []).map((c) => [c.slug, c.name]));
  const items = [];
  for (const it of req_items) {
    const p = byId[it.id]; const qty = Math.max(1, Math.min(10, parseInt(it.qty) || 1)); const size = String(it.size);
    if (!p || !p.active) return NextResponse.json({ error: "An item in your bag is no longer available." }, { status: 409 });
    if ((Number(p.sizes?.[size]) || 0) < qty) return NextResponse.json({ error: `${p.name} (Pack ${size}) is out of stock or has fewer left than you asked for.` }, { status: 409 });
    const col = p.colors?.includes(it.color) ? it.color : p.colors?.[0] || "";
    const pk = Array.isArray(p.packs) ? p.packs.find((x) => String(x.n) === size) : null;
    items.push({ id: p.id, name: p.name, size, qty, price: pk ? Number(pk.price) : Number(p.price), image: p.images?.[0] || "", color: cname[col] || col });
  }
  const subtotal = items.reduce((t, i) => t + i.price * i.qty, 0);

  let rule = null, code = clean(body.code, 30).toUpperCase().replace(/[^A-Z0-9_-]/g, "");
  if (code) {
    const { data: d } = await sb.from("discounts").select("*").eq("code", code).maybeSingle();
    const chk = checkDiscount(d, subtotal);
    if (!chk.ok) return NextResponse.json({ error: chk.error }, { status: 400 });
    rule = chk.rule;
  }
  const price = priceOrder({ subtotal, method, cfg, discount: rule });


  let userId = null;
  try { const ses = sessionClient(); const { data: { user } } = await ses.auth.getUser(); userId = user?.id || null; } catch {}

  const base = { user_id: userId, email: customer.email, phone: customer.phone, name: customer.name, shipping_address: address, items, subtotal, shipping: price.shipping, total: price.total, status: "pending_payment" };
  const extra = { payment_method: method, amount_due: price.due, discount: price.discount, discount_code: price.discount ? rule.code : null };
  let { data: order, error } = await sb.from("orders").insert({ ...base, ...extra }).select().single();
  if (error?.code === "42703" && method === "online" && !price.discount) ({ data: order, error } = await sb.from("orders").insert(base).select().single()); // migration_2 not run yet
  if (error) return NextResponse.json({ error: error.code === "42703" ? "Store setup is incomplete (run migration_2.sql in Supabase)." : "Could not create your order. Please try again." }, { status: 500 });

  // COD with 0% upfront: no online payment at all
  if (price.payNow === 0) {
    const r = await markPaid(order.id, "COD");
    if (r.error) return NextResponse.json({ error: r.error }, { status: 500 });
    return NextResponse.json({ cod: true, orderNumber: order.order_number, due: price.due, total: price.total });
  }
  try {
    const rzp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    const ro = await rzp.orders.create({ amount: price.payNow * 100, currency: "INR", receipt: order.order_number, notes: { order_id: order.id, method } });
    await sb.from("orders").update({ razorpay_order_id: ro.id }).eq("id", order.id);
    return NextResponse.json({ orderId: order.id, orderNumber: order.order_number, rzpOrderId: ro.id, amount: price.payNow * 100, due: price.due, total: price.total, method, key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID, prefill: customer });
  } catch (e) {
    console.error("[razorpay create]", e);
    return NextResponse.json({ error: "Payment gateway error. Please try again." }, { status: 502 });
  }
}
