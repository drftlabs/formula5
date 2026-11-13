# Formula 5 store

Next.js 14 (App Router) + Supabase + Razorpay + Resend.

## Run locally
```
npm install
cp .env.example .env.local      # leave the Supabase values empty for the preview
npm run dev                     # http://localhost:3000
```
With no Supabase keys the store runs on built-in sample data (`lib/fallback.js`, products from `lib/products.seed.json`).

## Go live
1. Supabase SQL Editor: run `schema.sql`, then `migration_2` to `migration_9` in order, then `reset_formula5.sql` (only if old store data is present), then `seed.sql` (26 products, categories, concerns, slides, blocks; reviews are added unapproved).
2. Set the env vars from `.env.example` (Supabase, Razorpay, Resend, site URL) in Vercel.
3. Admin at `/admin`: Products (packs, price, stock), Categories, Concerns, Reviews (approve only genuine ones), Slides, Block placement, Settings, Legal pages.

## Notes
- Cart line `size` holds the pack number ("1", "2", "3"); price and stock are checked per pack on the server.
- Preview data lives in `lib/fallback.js`; set `SHOW_REVIEWS` to false to hide placeholder reviews.
- Return and exchange pages are removed. Refund & Cancellation is kept.
