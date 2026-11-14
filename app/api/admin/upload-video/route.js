import { NextResponse } from "next/server";
import { handleUpload } from "@vercel/blob/client";
import { getAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

// Videos are too big for a normal request (Vercel caps those at ~4.5 MB), so the browser uploads straight to Vercel Blob.
// This route only checks that you are a signed-in admin and hands out a short-lived upload token.
export async function POST(req) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ error: "Video upload needs Vercel Blob. Add a Blob store in Vercel (Storage tab) and redeploy." }, { status: 501 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  try {
    const json = await handleUpload({
      body, request: req,
      onBeforeGenerateToken: async () => {
        if (!(await getAdmin())) throw new Error("Unauthorized");
        return { allowedContentTypes: ["video/mp4", "video/webm", "video/quicktime"], maximumSizeInBytes: 30 * 1024 * 1024, addRandomSuffix: true, cacheControlMaxAge: 31536000 };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (e) { return NextResponse.json({ error: e.message || "Upload failed" }, { status: 400 }); }
}
