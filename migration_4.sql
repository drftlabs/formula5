-- Migration 4: free shipping above Rs 1,499 and delivery in 3-4 working days. Safe to run more than once.
insert into public.site_settings(key,value) values
 ('free_shipping_min','1499'::jsonb),
 ('delivery_days','"3–4 business days"'::jsonb),
 ('ticker','["Free shipping above ₹1,499", "Drop 01 is live", "Make your mark", "街 Street series 001"]'::jsonb)
on conflict (key) do update set value=excluded.value, updated_at=now();
