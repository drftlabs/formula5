-- Migration 8: Formula 5 catalogue (packs, categories, concerns, reviews, subscribers). Safe to run more than once.
-- Run in Supabase SQL Editor AFTER schema.sql and migrations 2-7, then run seed.sql.

alter table public.products
  add column if not exists packs jsonb not null default '[]'::jsonb,         -- [{n:1,price:240,mrp:299,sku:"F50001"}]
  add column if not exists category text,
  add column if not exists concerns text[] not null default '{}',
  add column if not exists tagline text default '',
  add column if not exists top_ingredients text[] not null default '{}',
  add column if not exists how_to_use text default '',
  add column if not exists ingredients_raw text default '',
  add column if not exists usp text default '',
  add column if not exists benefits text default '',
  add column if not exists captions text[] not null default '{}',
  add column if not exists accent text;
-- sizes now means stock per PACK: {"1": 50, "2": 50, "3": 50}

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text unique not null, description text default '', accent text default '#E5CC85',
  image text default '', banner text default '', banner_mobile text default '',
  active boolean not null default true, sort_order int not null default 0
);
create table if not exists public.concerns (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text unique not null, icon text default 'glow', accent text default '#E5CC85',
  image text default '', active boolean not null default true, sort_order int not null default 0
);
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_slug text not null, name text not null default '', rating int not null default 5 check (rating between 1 and 5),
  title text default '', body text not null default '', verified boolean not null default false,
  approved boolean not null default false, featured boolean not null default false,
  sort_order int not null default 0, created_at timestamptz default now()
);
create index if not exists reviews_product_idx on public.reviews(product_slug);
create table if not exists public.subscribers (
  id uuid primary key default gen_random_uuid(), email text unique not null, created_at timestamptz default now()
);

alter table public.slides
  add column if not exists subtext text default '', add column if not exists cta2_text text default '',
  add column if not exists cta2_link text default '', add column if not exists accent text, add column if not exists art text;

alter table public.blocks drop constraint if exists blocks_type_check;
alter table public.blocks add constraint blocks_type_check check (type in
  ('hero','products','banner','collections','story','image','categories','concerns','routine','editorial','promos','why','testimonials','newsletter'));

alter table public.orders alter column order_number set default ('F5-' || nextval('public.order_seq'));

do $$ declare t text; begin
  foreach t in array array['categories','concerns','reviews','subscribers'] loop
    execute format('alter table public.%1$s enable row level security', t);
    execute format('drop policy if exists "admin all %1$s" on public.%1$s', t);
    execute format('create policy "admin all %1$s" on public.%1$s for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;
drop policy if exists "public read categories" on public.categories; create policy "public read categories" on public.categories for select using (active);
drop policy if exists "public read concerns" on public.concerns;     create policy "public read concerns" on public.concerns for select using (active);
drop policy if exists "public read reviews" on public.reviews;       create policy "public read reviews" on public.reviews for select using (approved);
