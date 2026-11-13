// Meta Pixel helper: safe to call anywhere (does nothing if no pixel is set up or the visitor blocks it).
export function track(event, data = {}, eventId) {
  try { if (typeof window !== "undefined" && typeof window.fbq === "function") window.fbq("track", event, data, eventId ? { eventID: eventId } : undefined); } catch {}
}
export const pixelItem = (p, qty = 1) => ({ id: p.id, quantity: qty, item_price: p.price });
