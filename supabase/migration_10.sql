-- Migration 10: review date + store reply. Safe to run more than once.
alter table public.reviews add column if not exists review_date date;
alter table public.reviews add column if not exists reply text default '';
alter table public.products add column if not exists best_for text default '';
