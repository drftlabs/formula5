"use server";
import { revalidatePath } from "next/cache";
import { guard } from "../admin";
import { serviceClient } from "../supabase/server";
import { sendEmail, abandonedCartEmail } from "../email";

/** Sends the "you left something in your bag" email. kind: "cart" (checkouts row) or "order" (unpaid order). */
export async function sendReminder(kind, id, code = "") {
  { const g = await guard("abandoned"); if (g) return g; }
  const sb = serviceClient();
  code = String(code || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 30);
  let c, sid;
  if (kind === "order") {
    const { data: o } = await sb.from("orders").select("id,name,email,phone,items,total,shipping_address").eq("id", id).maybeSingle();
    if (!o) return { error: "Order not found" };
    c = { name: o.name, email: o.email, phone: o.phone, items: o.items || [], total: o.total, city: o.shipping_address?.city, state: o.shipping_address?.state, pin: o.shipping_address?.pin }; sid = `order:${o.id}`;
  } else {
    const { data } = await sb.from("checkouts").select("*").eq("sid", id).maybeSingle();
    if (!data) return { error: "Cart not found" };
    c = data; sid = data.sid;
  }
  if (!/^\S+@\S+\.\S+$/.test(c.email || "")) return { error: "No valid email for this customer" };
  const ok = await sendEmail({ to: c.email, ...abandonedCartEmail(c, code) });
  if (!ok) return { error: process.env.RESEND_API_KEY ? "The email could not be sent (check Resend)." : "Email isn't set up yet (add RESEND_API_KEY in Vercel)." };
  const { data: prev } = await sb.from("checkouts").select("reminder_count").eq("sid", sid).maybeSingle();
  const row = { sid, email: c.email, name: c.name, phone: c.phone, items: c.items, total: c.total, city: c.city || null, state: c.state || null, pin: c.pin || null, reminded_at: new Date().toISOString(), reminder_count: (prev?.reminder_count || 0) + 1, updated_at: new Date().toISOString() };
  await sb.from("checkouts").upsert(row);
  revalidatePath("/admin/abandoned");
  return { ok: true };
}
