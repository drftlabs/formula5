-- Migration 7: admin overhaul (traffic analytics, abandoned carts, order cancellation, team users & roles).
-- Safe to run more than once. Run in Supabase -> SQL Editor.

-- 1) Website traffic events (page views, add-to-cart, checkout). No IP addresses are stored, only city/region.
create table if not exists public.site_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  sid text, vid text,
  type text not null,                       -- view | cart | checkout
  path text, ref text, source text,
  city text, region text, country text, device text,
  duration int not null default 0           -- seconds spent on the page
);
create index if not exists site_events_created_idx on public.site_events(created_at desc);
create index if not exists site_events_sid_idx on public.site_events(sid);
alter table public.site_events enable row level security;      -- only the server (service role) reads/writes

-- 2) Checkouts in progress (for abandoned-cart follow-up)
create table if not exists public.checkouts (
  sid text primary key,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  email text, name text, phone text,
  city text, state text, pin text,
  items jsonb not null default '[]'::jsonb,
  total int not null default 0,
  reminded_at timestamptz,
  reminder_count int not null default 0
);
create index if not exists checkouts_updated_idx on public.checkouts(updated_at desc);
alter table public.checkouts enable row level security;

-- 3) Order cancellation details
alter table public.orders add column if not exists cancelled_at timestamptz;
alter table public.orders add column if not exists cancel_reason text;

-- put stock back when an order is cancelled
create or replace function public.increment_stock(p_id uuid, p_size text, p_qty int) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.products
     set sizes = jsonb_set(sizes, array[p_size], to_jsonb(coalesce((sizes->>p_size)::int, 0) + p_qty))
   where id = p_id and sizes ? p_size;
end $$;
revoke all on function public.increment_stock(uuid, text, int) from public, anon, authenticated;

-- 4) Team: staff users (sign in with a User ID + password) and roles (which admin tabs they can open)
create table if not exists public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  permissions text[] not null default '{}',
  created_at timestamptz default now()
);
alter table public.admin_roles enable row level security;

alter table public.admins add column if not exists username text unique;
alter table public.admins add column if not exists display_name text;
alter table public.admins add column if not exists role_id uuid;
alter table public.admins add column if not exists permissions text[] not null default '{}';
alter table public.admins add column if not exists is_owner boolean not null default false;
alter table public.admins add column if not exists active boolean not null default true;
-- everyone who is an admin today keeps full access (owner)
update public.admins set is_owner = true where username is null;
