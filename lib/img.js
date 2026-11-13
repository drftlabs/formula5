// Product and banner pictures are served through Vercel's image optimizer (/_next/image): resized to the size
// actually needed and converted to WebP, then cached on Vercel's edge. Your Supabase storage is only the origin.
// Set NEXT_PUBLIC_IMG_RAW=1 to bypass (local preview with no internet).
const W = [96, 128, 256, 384, 640, 750, 828, 1080, 1200, 1920];
const snap = (w) => W.find((x) => x >= w) || W[W.length - 1];
export function opt(src, w = 640, q = 75) {
  if (!src || typeof src !== "string") return src;
  if (process.env.NEXT_PUBLIC_IMG_RAW === "1" || /^data:|\.svg(\?|$)/i.test(src)) return src;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${snap(w)}&q=${q}`;
}
export const srcSet = (src, ws = [384, 640, 828, 1080, 1200], q = 75) => (src ? ws.map((w) => `${opt(src, w, q)} ${snap(w)}w`).join(", ") : undefined);
