import crypto from "crypto";

// WhatsApp order confirmation (4-digit code). Uses Meta's WhatsApp Cloud API.
// Env: WHATSAPP_TOKEN (permanent access token), WHATSAPP_PHONE_ID (sender phone number id),
//      WHATSAPP_TEMPLATE (approved "authentication" template name, default order_confirm_code), WHATSAPP_LANG (default en).
// The checkout only asks for this when NEXT_PUBLIC_WA_CONFIRM=1 and the customer chose cash on delivery with 0% advance.
export const waEnabled = () => !!process.env.NEXT_PUBLIC_WA_CONFIRM;
export const waConfigured = () => !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID);
export const cleanPhone = (v) => String(v || "").replace(/\D/g, "").slice(-10);
export const validPhone = (p) => /^[6-9]\d{9}$/.test(p);
export const hashCode = (phone, code) => crypto.createHash("sha256").update(`${phone}:${code}:${process.env.SUPABASE_SERVICE_ROLE_KEY || "f5"}`).digest("hex");
export const newCode = () => String(crypto.randomInt(1000, 10000));

export async function sendWhatsAppCode(phone, code) {
  const r = await fetch(`https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp", to: "91" + phone, type: "template",
      template: {
        name: process.env.WHATSAPP_TEMPLATE || "order_confirm_code", language: { code: process.env.WHATSAPP_LANG || "en" },
        components: [{ type: "body", parameters: [{ type: "text", text: code }] }, { type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: code }] }],
      },
    }),
  });
  if (!r.ok) { console.error("[whatsapp]", r.status, await r.text().catch(() => "")); throw new Error("send failed"); }
}
