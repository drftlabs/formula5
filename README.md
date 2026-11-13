# Formula 5 store (Phase 1: home page)

Next.js 14 (App Router) + Supabase + Razorpay + Resend, built on the Taeken codebase.

## Run the home page locally
```
npm install
cp .env.example .env.local      # leave the Supabase values empty for the preview
npm run dev                     # http://localhost:3000
```
With no Supabase keys the home page runs on built-in sample data (`lib/fallback.js`, products from `lib/products.seed.json`).

## What is in Phase 1
- New design system: `app/f5.css` (tokens in `app/globals.css`), Montserrat (self-hosted).
- Home page blocks (`components/HomeBlocks.js`, order set by the `blocks` list): hero slider, categories, concerns, best sellers, new arrivals, The Formula, promos, why Formula 5, reviews, newsletter.
- Shared shell: announcement bar, header, bag drawer, trust bar, footer.
- Placeholder pack shots (`components/Bottle.js`) are used until product photos are uploaded.

## Not yet done (later phases)
Product page, category and concern pages, admin fields for the new sections, Supabase schema/seed for Formula 5, legal page text, full removal of remaining Taeken wording in admin, emails and legal defaults, launch guide.
