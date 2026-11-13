import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

// Admin photo uploads go to Vercel Blob (not Supabase storage), so Supabase's 5 GB is kept for data.
// Add a Blob store to the Vercel project (Storage tab) and it sets BLOB_READ_WRITE_TOKEN automatically.
export async function POST(req) {
  if (!(await getAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ error: "blob-not-configured" }, { status: 501 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file"), folder = String(form?.get("folder") || "misc").replace(/[^a-z0-9_-]/gi, "");
  if (!file || typeof file === "string") return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!/^image\//.test(file.type)) return NextResponse.json({ error: "Images only" }, { status: 400 });
  if (file.size > 4 * 1024 * 1024) return NextResponse.json({ error: "Image is over 4 MB. Use a smaller photo." }, { status: 413 });
  const name = String(file.name || "image").toLowerCase().replace(/[^a-z0-9.]+/g, "-").slice(-60);
  const blob = await put(`${folder}/${name}`, file, { access: "public", addRandomSuffix: true, cacheControlMaxAge: 31536000, contentType: file.type });
  return NextResponse.json({ url: blob.url });
}
