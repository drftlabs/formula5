import { serviceClient } from "@/lib/supabase/server";
import MediaBulk from "@/components/admin/MediaBulk";

export const dynamic = "force-dynamic";

export default async function Page() {
  const sb = serviceClient(); let files = [];
  try {
    const { data } = await sb.storage.from("media").list("bulk", { limit: 1000, sortBy: { column: "created_at", order: "desc" } });
    files = (data || []).filter((f) => f.name && !f.name.startsWith(".")).map((f) => ({ name: f.name, url: sb.storage.from("media").getPublicUrl("bulk/" + f.name).data.publicUrl }));
  } catch {}
  return <><h1>Bulk photos</h1>
    <p className="sub">Upload all your product photos in one go, then download a ready CSV of the links. Name each file like <b>signal-high-1.png</b>, <b>signal-high-2.png</b> (product name, then 1, 2, 3…) and the links file comes out already grouped per product as image_1, image_2, image_3…</p>
    <MediaBulk initial={files} /></>;
}
