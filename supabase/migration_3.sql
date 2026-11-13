-- Taeken migration 3: separate "extra photos" block on product pages. Safe to run more than once.
alter table public.products add column if not exists extra_images text[] not null default '{}';
