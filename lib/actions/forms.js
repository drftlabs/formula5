"use server";
import { serviceClient } from "../supabase/server";
import { sendEmail, adminMessageEmail, messageReceiptEmail } from "../email";

const clean = (v, n = 2000) => String(v ?? "").trim().slice(0, n);

/** Contact + complaint forms. Used with useFormState. */
export async function submitMessage(prev, fd) {
  if (clean(fd.get("website"))) return { ok: true, ref: "TK-MSG" }; // honeypot: bots fill this hidden field
  const type = fd.get("type") === "complaint" ? "complaint" : "contact";
  const m = {
    type, name: clean(fd.get("name"), 120), email: clean(fd.get("email"), 200).toLowerCase(), phone: clean(fd.get("phone"), 30),
    order_number: clean(fd.get("order_number"), 40), category: clean(fd.get("category"), 80), subject: clean(fd.get("subject"), 160), message: clean(fd.get("message"), 5000),
  };
  if (!m.name || !/^\S+@\S+\.\S+$/.test(m.email) || m.message.length < 10) return { error: "Please fill in your name, a valid email and a message (at least 10 characters)." };
  const sb = serviceClient();
  if (!sb) return { error: "The store backend isn't connected yet." };
  const { data, error } = await sb.from("messages").insert(m).select("id").single();
  if (error) return { error: "Sorry, something went wrong. Please email us instead." };
  const ref = "TK-" + (type === "complaint" ? "C" : "M") + data.id.slice(0, 6).toUpperCase();
  await sendEmail({ to: m.email, ...messageReceiptEmail(m, ref) });
  if (process.env.ADMIN_NOTIFY_EMAIL) await sendEmail({ to: process.env.ADMIN_NOTIFY_EMAIL, ...adminMessageEmail(m) });
  return { ok: true, ref };
}

/** Newsletter signup from the home page footer block. */
export async function subscribe(prev, fd) {
  if (clean(fd.get("website"))) return { ok: true }; // honeypot
  const email = clean(fd.get("email"), 200).toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Please enter a valid email address." };
  const sb = serviceClient();
  if (!sb) return { error: "The store backend isn't connected yet." };
  const { error } = await sb.from("subscribers").upsert({ email }, { onConflict: "email", ignoreDuplicates: true });
  return error ? { error: "Sorry, something went wrong. Please try again." } : { ok: true };
}
