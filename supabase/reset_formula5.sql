-- ONE-TIME CLEANUP: removes the old store's sample content (sneakers, old slides, blocks, tags, collections, settings).
-- It does NOT touch your admin users, customers or orders.
-- Order: run migration_8.sql first, then THIS file, then seed.sql.

delete from public.products;
delete from public.slides;
delete from public.blocks;
delete from public.collections;
delete from public.tags;
delete from public.colors;
delete from public.pages where slug in ('returns','exchange');
delete from public.site_settings where key = 'site';
-- the next line only matters if you ran migration_8 already and want to reload categories/concerns/reviews too
delete from public.categories;
delete from public.concerns;
delete from public.reviews;
