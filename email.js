import { esc, inr, SITE_URL } from "./format";

// Sends mail through Resend if RESEND_API_KEY is set; otherwise logs (so nothing breaks in dev).
export async function sendEmail({ to, subject, html }) {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) { console.log("[email skipped]", subject, "->", to); return false; }
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM || "Formula 5 <orders@example.com>", to, subject, html }),
    });
    if (!r.ok) console.error("[email failed]", r.status, await r.text());
    return r.ok;
  } catch (e) { console.error("[email error]", e.message); return false; }
}

const shell = (body) => `<div style="background:#FBF9F4;padding:28px;font-family:Arial,sans-serif;color:#1B1A17"><div style="max-width:560px;margin:auto"><div style="border-top:4px solid #A8812F;padding-top:18px;font-size:22px;letter-spacing:.2em;font-weight:800">FORMULA 5</div>${body}<p style="color:#6C6860;font-size:12px;margin-top:28px">Precision. Purity. Performance. · <a style="color:#6C6860" href="${SITE_URL}">${SITE_URL.replace("https://", "")}</a></p></div></div>`;
const itemsHtml = (o) => (o.items || []).map((i) => `<tr><td style="padding:6px 0">${esc(i.name)}${i.color ? " · " + esc(i.color) : ""} · Pack ${esc(i.size)} × ${i.qty}</td><td align="right">${inr(i.price * i.qty)}</td></tr>`).join("");

export const orderConfirmationEmail = (o) => ({
  subject: `Order ${o.order_number} confirmed`,
  html: shell(`<h1 style="font-size:28px;margin:22px 0 8px">Order confirmed.</h1><p>Thanks ${esc(o.name || "")}. We're getting your order ready.</p>
  <table width="100%" style="border-top:1px solid #E4DFD2;margin-top:18px;font-size:14px">${itemsHtml(o)}${o.discount > 0 ? `<tr><td style="padding-top:12px;color:#6C6860">Discount${o.discount_code ? " (" + esc(o.discount_code) + ")" : ""}</td><td align="right" style="padding-top:12px">−${inr(o.discount)}</td></tr>` : ""}<tr><td style="padding-top:12px;color:#6C6860">${o.payment_method === "cod" ? "COD delivery fee" : "Shipping"}</td><td align="right" style="padding-top:12px">${o.shipping ? inr(o.shipping) : "Free"}</td></tr><tr><td style="font-weight:800">Total</td><td align="right" style="font-weight:800">${inr(o.total)}</td></tr></table>
  ${o.payment_method === "cod" ? `<p style="margin-top:14px;padding:12px;background:#F3EAD3;color:#6a4f14;font-size:14px"><b>Cash on delivery.</b> You paid ${inr(o.amount_paid)} online. Please keep <b>${inr(o.amount_due)}</b> ready to pay the delivery partner.</p>` : ""}
  <p style="margin-top:22px;font-size:14px">Order number: <b>${esc(o.order_number)}</b><br>Track it anytime: <a style="color:#A8812F" href="${SITE_URL}/account/login">log in with this email</a> (we'll send a one-time code) or use <a style="color:#A8812F" href="${SITE_URL}/track">order tracking</a>.</p>`),
});

export const shippedEmail = (o) => ({
  subject: `Your Formula 5 order ${o.order_number} has shipped`,
  html: shell(`<h1 style="font-size:28px;margin:22px 0 8px">It's on the way.</h1><p>Order <b>${esc(o.order_number)}</b> has shipped.</p>
  <p style="font-size:14px">Courier: <b>${esc(o.courier || "-")}</b><br>Tracking number: <b>${esc(o.tracking_number || "-")}</b></p>
  ${o.tracking_url ? `<p><a style="display:inline-block;background:#1B1A17;color:#FFFFFF;padding:12px 20px;text-decoration:none;font-weight:800" href="${esc(o.tracking_url)}">TRACK PACKAGE</a></p>` : ""}`),
});

export const adminMessageEmail = (m) => ({
  subject: `[${m.type === "complaint" ? "Complaint" : "Contact"}] ${m.subject || m.category || "New message"}`,
  html: `<p><b>${esc(m.name)}</b> &lt;${esc(m.email)}&gt; ${esc(m.phone || "")}</p><p>Order: ${esc(m.order_number || "-")}</p><p style="white-space:pre-wrap">${esc(m.message)}</p>`,
});

export const messageReceiptEmail = (m, ref) => ({
  subject: `We received your ${m.type === "complaint" ? "complaint" : "message"} (ref ${ref})`,
  html: shell(`<h1 style="font-size:26px;margin:22px 0 8px">We've got it.</h1><p>Your reference is <b>${esc(ref)}</b>. ${m.type === "complaint" ? "We will acknowledge and work to resolve your complaint within the timelines in our Grievance Redressal policy." : "We'll reply as soon as we can."}</p>`),
});

export const cancelledEmail = (o, reason) => ({
  subject: `Your Formula 5 order ${o.order_number} has been cancelled`,
  html: shell(`<h1 style="font-size:26px;margin:22px 0 8px">Order cancelled.</h1><p>Your order <b>${esc(o.order_number)}</b> has been cancelled${reason ? `: ${esc(reason)}` : ""}.</p>${o.payment_method !== "cod" || Number(o.amount_paid) > 0 ? `<p style="font-size:14px">If you already paid online, your refund will reach the original payment method in 5–7 working days.</p>` : ""}<p style="font-size:14px">Questions? Just reply to this email.</p>`),
});

export const abandonedCartEmail = (c, code) => ({
  subject: "You left something in your bag",
  html: shell(`<h1 style="font-size:28px;margin:22px 0 8px">Still thinking it over?</h1><p>Hi ${esc((c.name || "").split(" ")[0] || "there")}, your order is still waiting.</p>
  <table width="100%" style="border-top:1px solid #E4DFD2;margin-top:18px;font-size:14px">${itemsHtml(c)}<tr><td style="font-weight:800;padding-top:10px">Total</td><td align="right" style="font-weight:800;padding-top:10px">${inr((c.items || []).reduce((t, i) => t + i.price * i.qty, 0))}</td></tr></table>
  ${code ? `<p style="margin-top:14px;padding:12px;background:#F3EAD3;color:#6a4f14;font-size:14px">Use code <b>${esc(code)}</b> at checkout.</p>` : ""}
  <p style="margin-top:20px"><a style="display:inline-block;background:#A8812F;color:#fff;padding:13px 22px;text-decoration:none;font-weight:800;letter-spacing:.08em" href="${SITE_URL}/checkout">COMPLETE MY ORDER</a></p>
  <p style="font-size:12px;color:#6C6860;margin-top:18px">Complete your order whenever you are ready.</p>`),
});
