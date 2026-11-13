import { serviceClient } from "./supabase/server";
import { sendEmail, orderConfirmationEmail } from "./email";

/** Find or create the customer's login account from their email (no password: they log in with an email code). */
export async function ensureCustomer(email, name) {
  const sb = serviceClient(); email = String(email).trim().toLowerCase();
  let { data: c } = await sb.from("customers").select("user_id").eq("email", email).maybeSingle();
  if (c) return c.user_id;
  const { data, error } = await sb.auth.admin.createUser({ email, email_confirm: true, user_metadata: { name } });
  if (!error) return data.user.id;
  ({ data: c } = await sb.from("customers").select("user_id").eq("email", email).maybeSingle());
  return c?.user_id || null;
}

/** Idempotent: marks an order paid, reduces stock, creates the customer account, sends the confirmation. */
export async function markPaid(orderId, paymentId) {
  const sb = serviceClient();
  const { data: order } = await sb.from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!order) return { error: "Order not found" };
  if (order.status !== "pending_payment") return { ok: true, order, already: true };
  const userId = order.user_id || (await ensureCustomer(order.email, order.name));
  const { data: upd, error } = await sb.from("orders")
    .update({ status: "paid", razorpay_payment_id: paymentId, paid_at: new Date().toISOString(), user_id: userId, ...("amount_paid" in order ? { amount_paid: order.total - (order.amount_due || 0) } : {}) })
    .eq("id", orderId).eq("status", "pending_payment").select().maybeSingle();
  if (error) return { error: error.message };
  if (!upd) return { ok: true, order, already: true }; // another request won the race
  for (const it of order.items) await sb.rpc("decrement_stock", { p_id: it.id, p_size: String(it.size), p_qty: it.qty });
  if (upd.discount_code) await sb.rpc("use_discount", { p_code: upd.discount_code });
  const mail = orderConfirmationEmail(upd);
  await sendEmail({ to: upd.email, ...mail });
  if (process.env.ADMIN_NOTIFY_EMAIL) await sendEmail({ to: process.env.ADMIN_NOTIFY_EMAIL, subject: `New ${upd.payment_method === "cod" ? "COD " : ""}order ${upd.order_number} (₹${upd.total})`, html: `<p>New order <b>${upd.order_number}</b> from ${upd.name} (${upd.email}).${upd.payment_method === "cod" ? ` <b>COD: collect ₹${upd.amount_due} on delivery.</b>` : ""} Open the admin panel to fulfil it.</p>` });
  return { ok: true, order: upd };
}
