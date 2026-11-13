-- Taeken migration 5: "Large image" homepage block (placed right after the products row). Safe to run more than once.
alter table public.blocks drop constraint if exists blocks_type_check;
alter table public.blocks add constraint blocks_type_check check (type in ('hero','products','banner','collections','story','image'));
insert into public.blocks(type, title, enabled, sort_order, config)
select 'image','Large image',true,25,'{"image":"","image_mobile":"","fit":"contain","caption":"","link":"","alt":""}'::jsonb
where not exists (select 1 from public.blocks where type='image');
