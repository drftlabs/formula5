import { serviceClient } from "./supabase/server";
import { SETTINGS } from "./fallback";
import { mergeSizes } from "./format";

export async function loadProductFormData() {
  const sb = serviceClient();
  const [{ data: collections }, { data: tags }, { data: colors }, { data: st }] = await Promise.all([
    sb.from("collections").select("id,name").order("sort_order"), sb.from("tags").select("slug,name,bg,fg").order("sort_order"),
    sb.from("colors").select("slug,name,hex").order("sort_order"), sb.from("site_settings").select("value").eq("key", "site").maybeSingle(),
  ]);
  const sizes = mergeSizes(st?.value?.sizes || SETTINGS.sizes);
  return { collections: collections || [], tags: tags || [], colors: colors || [], sizeKeys: sizes };
}
