-- Migration 9: WhatsApp order confirmation codes. Safe to run more than once.
create table if not exists public.wa_otps (
  phone text primary key,
  code_hash text,
  expires_at timestamptz,
  attempts int not null default 0,
  sent_at timestamptz,
  verified_until timestamptz
);
alter table public.wa_otps enable row level security;   -- no policies: only the server (service role) can read or write
