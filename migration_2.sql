-- Migration 2: Shopify-style catalogue, COD, discount codes.
-- Safe to run more than once. Run it in Supabase -> SQL Editor.

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
