-- =====================================================================
-- FORMULA 5 STORE: database schema. Run ONCE in Supabase → SQL Editor.
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE where possible.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- helpers ----------
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

create or replace function public.is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- every auth user gets a customers row (used to link orders by email)
create table if not exists public.customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  created_at timestamptz default now()
);
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.customers(user_id, email) values (new.id, lower(new.email)) on conflict do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- content ----------
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.tags (          -- labels like "New Drop", "Bestseller"
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  bg text not null default '#D7262B',
  fg text not null default '#FFFFFF',
  sort_order int not null default 0
);

create table if not exists public.colors (        -- colour options for products
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  hex text not null default '#0B0B0B',
  sort_order int not null default 0
);

create table if not exists public.collections (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  kanji text default '',
  image text default '',
  position text default '50% 50%',
  show_home boolean not null default true,
  active boolean not null default true,
  sort_order int not null default 0
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  price int not null check (price >= 0),            -- rupees
  compare_price int,                                -- optional strike-through price
  description text default '',
  details text default '',                          -- one bullet per line
  images text[] not null default '{}',              -- first = main transparent PNG
  colors text[] not null default '{}',              -- colour slugs
  tags text[] not null default '{}',                -- tag slugs
  sizes jsonb not null default '{}'::jsonb,         -- {"6": 10, "7": 0, ...} = stock per UK size
  collection_id uuid references public.collections(id) on delete set null,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz default now()
);
create index if not exists products_collection_idx on public.products(collection_id);

create table if not exists public.slides (        -- hero slider
  id uuid primary key default gen_random_uuid(),
  kicker text default '',
  title text not null default '',                   -- use | for a line break
  cta_text text default 'Shop now',
  link text default '/collections/all',
  image text default '',
  image_mobile text default '',
  position text default '50% 50%',
  active boolean not null default true,
  sort_order int not null default 0
);

create table if not exists public.blocks (        -- homepage sections: order + on/off + content
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('hero','products','banner','collections','story','image')),
  title text not null default '',                   -- admin label
  enabled boolean not null default true,
  sort_order int not null default 0,
  config jsonb not null default '{}'::jsonb
);

create table if not exists public.pages (         -- editable legal/policy page overrides
  slug text primary key,
  title text not null,
  body text not null,
  updated_at timestamptz default now()
);

-- ---------- commerce ----------
create sequence if not exists public.order_seq start 1001;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null default ('F5-' || nextval('public.order_seq')),
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  phone text,
  name text,
  shipping_address jsonb not null default '{}'::jsonb,
  items jsonb not null default '[]'::jsonb,         -- snapshot: id,name,size,qty,price,image
  subtotal int not null default 0,
  shipping int not null default 0,
  total int not null default 0,
  status text not null default 'pending_payment'
    check (status in ('pending_payment','paid','processing','shipped','delivered','cancelled','refunded')),
  razorpay_order_id text,
  razorpay_payment_id text,
  courier text,
  tracking_number text,
  tracking_url text,
  notes text,
  paid_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists orders_user_idx on public.orders(user_id);
create index if not exists orders_email_idx on public.orders(lower(email));
create index if not exists orders_rzp_idx on public.orders(razorpay_order_id);

create table if not exists public.wishlist (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, product_id)
);

create table if not exists public.messages (      -- contact + complaint forms
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('contact','complaint')),
  name text, email text, phone text,
  order_number text, category text, subject text,
  message text not null,
  status text not null default 'new' check (status in ('new','in_progress','resolved')),
  created_at timestamptz default now()
);

-- atomic stock decrement (called by the server after payment)
create or replace function public.decrement_stock(p_id uuid, p_size text, p_qty int) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.products
     set sizes = jsonb_set(sizes, array[p_size],
         to_jsonb(greatest(coalesce((sizes->>p_size)::int, 0) - p_qty, 0)))
   where id = p_id and sizes ? p_size;
end $$;
revoke all on function public.decrement_stock(uuid, text, int) from public, anon, authenticated;

-- ---------- Row Level Security ----------
alter table public.admins        enable row level security;
alter table public.customers     enable row level security;
alter table public.site_settings enable row level security;
alter table public.tags          enable row level security;
alter table public.colors        enable row level security;
alter table public.collections   enable row level security;
alter table public.products      enable row level security;
alter table public.slides        enable row level security;
alter table public.blocks        enable row level security;
alter table public.pages         enable row level security;
alter table public.orders        enable row level security;
alter table public.wishlist      enable row level security;
alter table public.messages      enable row level security;

-- public (storefront) can read content
drop policy if exists "public read settings"    on public.site_settings; create policy "public read settings"    on public.site_settings for select using (true);
drop policy if exists "public read tags"        on public.tags;          create policy "public read tags"        on public.tags          for select using (true);
drop policy if exists "public read colors"      on public.colors;        create policy "public read colors"      on public.colors        for select using (true);
drop policy if exists "public read collections" on public.collections;   create policy "public read collections" on public.collections   for select using (active);
drop policy if exists "public read products"    on public.products;      create policy "public read products"    on public.products      for select using (active);
drop policy if exists "public read slides"      on public.slides;        create policy "public read slides"      on public.slides        for select using (active);
drop policy if exists "public read blocks"      on public.blocks;        create policy "public read blocks"      on public.blocks        for select using (enabled);
drop policy if exists "public read pages"       on public.pages;         create policy "public read pages"       on public.pages         for select using (true);

-- admins can do everything on content (the admin panel also checks this server-side)
do $$ declare t text; begin
  foreach t in array array['site_settings','tags','colors','collections','products','slides','blocks','pages','orders','messages','customers'] loop
    execute format('drop policy if exists "admin all %1$s" on public.%1$s', t);
    execute format('create policy "admin all %1$s" on public.%1$s for all using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- a user can see their own admin row (needed for the admin check) and own data
drop policy if exists "self admin row" on public.admins;
create policy "self admin row" on public.admins for select using (user_id = auth.uid());
drop policy if exists "own customer row" on public.customers;
create policy "own customer row" on public.customers for select using (user_id = auth.uid());
drop policy if exists "own orders" on public.orders;
create policy "own orders" on public.orders for select using (user_id = auth.uid());
drop policy if exists "own wishlist" on public.wishlist;
create policy "own wishlist" on public.wishlist for all using (user_id = auth.uid()) with check (user_id = auth.uid());
-- NOTE: orders and messages are only ever written by the server (service role key), never by the browser.

-- ---------- Storage (product / banner images) ----------
insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict (id) do nothing;
drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects for select using (bucket_id = 'media');
drop policy if exists "media admin write" on storage.objects;
create policy "media admin write" on storage.objects for insert with check (bucket_id = 'media' and public.is_admin());
drop policy if exists "media admin update" on storage.objects;
create policy "media admin update" on storage.objects for update using (bucket_id = 'media' and public.is_admin());
drop policy if exists "media admin delete" on storage.objects;
create policy "media admin delete" on storage.objects for delete using (bucket_id = 'media' and public.is_admin());

-- ================= migration 2 (also in migration_2.sql) =================

-- ---- products: more fields ----
alter table public.products
  add column if not exists sku text,
  add column if not exists barcode text,
  add column if not exists vendor text default 'Formula 5',
  add column if not exists product_type text default '',
  add column if not exists cost_price int,
  add column if not exists weight_g int,
  add column if not exists seo_title text default '',
  add column if not exists seo_description text default '',
  add column if not exists long_description text default '',   -- story section; supports ![alt](image-url)
  add column if not exists low_stock int not null default 3,
  add column if not exists featured boolean not null default false,
  add column if not exists collection_ids uuid[] not null default '{}';  -- a product can sit in many collections
create index if not exists products_collection_ids_idx on public.products using gin (collection_ids);
update public.products set collection_ids = array[collection_id] where collection_id is not null and collection_ids = '{}';

-- ---- orders: COD + discounts ----
alter table public.orders
  add column if not exists payment_method text not null default 'online',   -- 'online' | 'cod'
  add column if not exists amount_paid int not null default 0,              -- collected online
  add column if not exists amount_due int not null default 0,               -- cash to collect on delivery (COD)
  add column if not exists discount int not null default 0,
  add column if not exists discount_code text;

-- ---- discount codes ----
create table if not exists public.discounts (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  type text not null default 'percent' check (type in ('percent','flat')),
  value int not null default 10,
  min_order int not null default 0,
  max_uses int,                       -- empty = unlimited
  used int not null default 0,
  expires_at timestamptz,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz default now()
);
alter table public.discounts enable row level security;   -- server (service role) only

-- admin policy on the new table
drop policy if exists "admin all discounts" on public.discounts;
create policy "admin all discounts" on public.discounts for all using (public.is_admin()) with check (public.is_admin());

-- bump a discount's use counter (called by the server after payment)
create or replace function public.use_discount(p_code text) returns void
language sql security definer set search_path = public as $$
  update public.discounts set used = used + 1 where code = upper(p_code);
$$;
revoke all on function public.use_discount(text) from public, anon, authenticated;

-- welcome code to try out (delete or edit in Admin -> Discount codes)
insert into public.discounts (code, type, value, min_order) values ('WELCOME10','percent',10,0) on conflict (code) do nothing;

-- migration 3
alter table public.products add column if not exists extra_images text[] not null default '{}';
-- Migration 4: free shipping above Rs 1,499 and delivery in 3-4 working days. Safe to run more than once.
insert into public.site_settings(key,value) values
 ('free_shipping_min','1499'::jsonb),
 ('delivery_days','"3–4 business days"'::jsonb),
 ('ticker','["Free shipping above ₹1,499", "Drop 01 is live", "Make your mark", "街 Street series 001"]'::jsonb)
on conflict (key) do update set value=excluded.value, updated_at=now();

-- Migration 5: "Large image" homepage block (placed right after the products row). Safe to run more than once.
alter table public.blocks drop constraint if exists blocks_type_check;
alter table public.blocks add constraint blocks_type_check check (type in ('hero','products','banner','collections','story','image'));
insert into public.blocks(type, title, enabled, sort_order, config)
select 'image','Large image',true,25,'{"image":"","image_mobile":"","fit":"contain","caption":"","link":"","alt":""}'::jsonb
where not exists (select 1 from public.blocks where type='image');
