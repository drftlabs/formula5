export const inr = (n) => "₹" + Number(n || 0).toLocaleString("en-IN");
export const slugify = (s) => String(s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
export const dateFmt = (d) => d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }) : "";
export const dayFmt = (d) => d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "";

export const STATUS = {
  pending_payment: "Awaiting payment", paid: "Paid", processing: "Processing", shipped: "Shipped",
  delivered: "Delivered", cancelled: "Cancelled", refunded: "Refunded",
};
export const STEPS = ["paid", "processing", "shipped", "delivered"];

export const STATES = ["Andaman and Nicobar Islands","Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chandigarh","Chhattisgarh","Dadra and Nagar Haveli and Daman and Diu","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jammu and Kashmir","Jharkhand","Karnataka","Kerala","Ladakh","Lakshadweep","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Puducherry","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal"];

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");

// Map the state names returned by the pin-code service onto our dropdown values.
export function matchState(name) {
  const n = String(name || "").toLowerCase().replace(/&/g, "and").replace(/\s+/g, " ").trim();
  const alias = { orissa: "odisha", pondicherry: "puducherry", uttaranchal: "uttarakhand", "dadra and nagar haveli": "dadra and nagar haveli and daman and diu", "daman and diu": "dadra and nagar haveli and daman and diu", "andaman and nicobar": "andaman and nicobar islands", "jammu and kashmir": "jammu and kashmir", "nct of delhi": "delhi" };
  const want = alias[n] || n;
  return STATES.find((x) => x.toLowerCase() === want) || "";
}

// Estimated delivery window: adds business days (Mon-Sat) to today. Returns "Tue, 11 Nov – Fri, 14 Nov".
export function etaRange(min, max) {
  const add = (n) => { const d = new Date(); let k = 0; while (k < n) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0) k++; } return d; };
  const f = (d) => d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  return `${f(add(min))} – ${f(add(max))}`;
}

// ---- Formula 5 helpers ----
// "Glow Boost Face Wash 10% Vitamin C" -> { short: "Glow Boost Face Wash", amount: "10%", inci: "Vitamin C" }
export function splitName(name = "") {
  const m = String(name).match(/^(.*?)\s+(\d+(?:\.\d+)?\s?(?:%|mg))\s+(.+)$/i);
  return m ? { short: m[1].trim(), amount: m[2].replace(/\s/g, ""), inci: m[3].trim() } : { short: String(name).trim(), amount: "", inci: "" };
}
// Plain-English label for the hero active where the INCI name is unambiguous. Everything else shows the name as written.
const FRIENDLY = { "argania spinosa oil": "Argan Oil", "allium cepa extract": "Onion Extract", "olea europaea oil": "Olive Oil", "theobroma cacao seed butter": "Cocoa Butter", "aloe barbadensis juice": "Aloe Vera Juice", "coffea arabica extract": "Coffee Extract", "withania somnifera": "Ashwagandha" };
export const activeLabel = (inci = "") => FRIENDLY[String(inci).toLowerCase()] || inci;
export const pctOff = (price, mrp) => (Number(mrp) > Number(price) ? Math.round(((mrp - price) / mrp) * 100) : 0);
export const packLabel = (n) => `Pack ${n}`;
// Variant keys (admin stock grid). Phase 2 replaces size variants with Pack 1/2/3.
export const UK_SIZES = ["1", "2", "3"];
export const mergeSizes = (txt) => [...new Set([...UK_SIZES, ...String(txt || "").split(",").map((s) => s.trim()).filter(Boolean)])].sort((a, b) => a - b);
