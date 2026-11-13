-- =====================================================================
-- TAEKEN STORE: starter content. Run AFTER schema.sql (SQL Editor).
-- Everything here is editable later from /admin. Re-running is safe.
-- =====================================================================

insert into public.site_settings(key, value) values ('site', '{
  "business_name": "Taeken",
  "legal_name": "[Your registered business name]",
  "address": "[Registered business address]",
  "contact_email": "hello@taeken.in",
  "contact_phone": "",
  "gst_number": "",
  "instagram": "",
  "ticker": ["Free shipping above ₹1,499", "Drop 01 is live", "Make your mark", "街 Street series 001"],
  "free_shipping_min": 1499,
  "shipping_fee": 99,
  "dispatch_days": "1–2 business days",
  "delivery_days": "3–4 business days",
  "return_days": 7,
  "exchange_days": 7,
  "refund_days": 7,
  "jurisdiction": "[City], India",
  "grievance_name": "[Grievance Officer name]",
  "sizes": "6,7,8,9,10,11,12"
}'::jsonb) on conflict (key) do nothing;

insert into public.tags(name, slug, bg, fg, sort_order) values
  ('New Drop','new-drop','#D7262B','#FFFFFF',10),
  ('Bestseller','bestseller','#F5F3EE','#0B0B0B',20),
  ('Limited','limited','#C7B299','#0B0B0B',30),
  ('Sale','sale','#4D5A44','#FFFFFF',40)
on conflict (slug) do nothing;

insert into public.colors(name, slug, hex, sort_order) values
  ('Obsidian','obsidian','#0B0B0B',10),('Chalk','chalk','#F5F3EE',20),('Concrete','concrete','#8A8A8A',30),
  ('Red','red','#D7262B',40),('Olive','olive','#4D5A44',50),('Sand','sand','#C7B299',60)
on conflict (slug) do nothing;

insert into public.collections(name, slug, kanji, show_home, sort_order) values
  ('High Tops','high-tops','高',true,10),('Court Classics','court-classics','古',true,20),
  ('Chunky Sneakers','chunky-sneakers','厚',true,30),('Low Tops','low-tops','低',true,40)
on conflict (slug) do nothing;

insert into public.slides(kicker, title, cta_text, link, sort_order)
select * from (values
  ('Taeken / Series 001','Make your|mark.','Shop the collection','/collections/all',10),
  ('Drop 01 / New','Fresh out|the box.','Shop new drop','/collections/high-tops',20),
  ('Street series','Own the|street.','Pick your shape','/#collections',30)
) v(kicker,title,cta_text,link,sort_order)
where not exists (select 1 from public.slides);

insert into public.blocks(type, title, enabled, sort_order, config)
select * from (values
  ('hero','Hero slider',true,10,'{}'::jsonb),
  ('products','Fresh out the box',true,20,'{"eyebrow":"Drop 01 / Latest","title":"Fresh|out the box","source":"all","source_value":"","limit":12,"collapse":true}'::jsonb),
  ('banner','Campaign banner',true,30,'{"variant":"campaign","plate":"001","kicker":"Street series / Designed in India","title":"Not made|to blend in.","cta_text":"Shop the drop","link":"/collections/all","image":"","image_mobile":"","position":"50% 50%"}'::jsonb),
  ('collections','Pick your shape',true,40,'{"eyebrow":"Collections","title":"Pick your|shape"}'::jsonb),
  ('story','Brand story',true,50,'{"eyebrow":"Our story","title":"Born in India.|Built on the street.","text":"Taeken is an Indian-born streetwear sneaker brand shaped by music, urban culture, movement and individual expression. Distinctive design. Everyday wearability. An accessible price.","link_text":"Read our story","link":"/our-story","image":"","position":"50% 40%"}'::jsonb),
  ('banner','Next drop banner',true,60,'{"variant":"next","plate":"002","kicker":"Next drop","title":"After hours.","cta_text":"Shop the collection","link":"/collections/all","image":"","image_mobile":"","position":"50% 50%"}'::jsonb)
) v(type,title,enabled,sort_order,config)
where not exists (select 1 from public.blocks);

-- sample products (no images yet: upload transparent PNGs in /admin/products)
insert into public.products(name, slug, price, tags, colors, sizes, collection_id, sort_order)
select p.name, p.slug, p.price, p.tags, p.colors, p.sizes::jsonb,
       (select id from public.collections where slug = p.coll), p.so
from (values
  ('Afterhours High','afterhours-high',2299,array['new-drop'],array['obsidian','chalk','red'],'{"6":6,"7":6,"8":8,"9":6,"10":4,"11":0}','high-tops',10),
  ('Court Classic','court-classic',1899,array['bestseller'],array['chalk','obsidian'],'{"6":0,"7":5,"8":8,"9":8,"10":5,"11":3}','court-classics',20),
  ('Terrain Chunky','terrain-chunky',2499,array['new-drop'],array['concrete','red'],'{"6":4,"7":0,"8":6,"9":6,"10":4,"11":0}','chunky-sneakers',30),
  ('Origin Low','origin-low',1699,array[]::text[],array['chalk','sand','olive'],'{"6":5,"7":5,"8":8,"9":8,"10":6,"11":4}','low-tops',40),
  ('Signal High','signal-high',2399,array[]::text[],array['obsidian','red'],'{"6":0,"7":4,"8":5,"9":5,"10":0,"11":0}','high-tops',50),
  ('Concrete Court','concrete-court',1799,array[]::text[],array['concrete','chalk'],'{"6":4,"7":5,"8":5,"9":5,"10":3,"11":0}','court-classics',60),
  ('Night Chunky','night-chunky',2199,array['limited'],array['obsidian','olive'],'{"6":0,"7":0,"8":4,"9":4,"10":4,"11":3}','chunky-sneakers',70),
  ('Daily Low','daily-low',1599,array[]::text[],array['sand','chalk'],'{"6":4,"7":4,"8":0,"9":5,"10":5,"11":0}','low-tops',80),
  ('Midnight High','midnight-high',2499,array[]::text[],array['obsidian'],'{"6":0,"7":5,"8":6,"9":6,"10":5,"11":3}','high-tops',90),
  ('Slab Court','slab-court',1999,array[]::text[],array['chalk','red'],'{"6":4,"7":5,"8":5,"9":4,"10":0,"11":0}','court-classics',100),
  ('Apex Chunky','apex-chunky',2299,array[]::text[],array['concrete','obsidian'],'{"6":0,"7":0,"8":5,"9":5,"10":4,"11":0}','chunky-sneakers',110),
  ('Corner Low','corner-low',1699,array[]::text[],array['olive','chalk'],'{"6":5,"7":5,"8":6,"9":6,"10":5,"11":4}','low-tops',120)
) as p(name,slug,price,tags,colors,sizes,coll,so)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- AFTER you create your admin login in Supabase → Authentication → Users,
-- make it an admin by running (replace the email):
--
--   insert into public.admins(user_id)
--   select id from auth.users where email = 'you@example.com';
-- ---------------------------------------------------------------------
