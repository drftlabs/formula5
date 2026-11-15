import { NextResponse } from "next/server";
import { handleUpload } from "@vercel/blob/client";
import { getAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

// Videos are too big for a normal request (Vercel caps those at ~4.5 MB), so the browser uploads straight to Vercel Blob.
// This route only checks that you are a signed-in admin and hands out a short-lived upload token.
export async function POST(req) {
  // diagnostics: the Blob SDK hides the real reason, so the admin screen asks this when an upload fails
  const peek = await req.clone().json().catch(() => null);
  if (peek?.diag) {
    const admin = !!(await getAdmin()), tok = !!process.env.BLOB_READ_WRITE_TOKEN, mb = Number(peek.size || 0) / 1048576;
    const why = !admin ? "You are signed out of the admin. Refresh the page, sign in again, then retry."
      : !tok ? "BLOB_READ_WRITE_TOKEN is missing. Add a Blob store in Vercel (Storage tab) and redeploy."
      : mb > 200 ? `The file is ${mb.toFixed(0)} MB; the limit is 200 MB.`
      : peek.ftype && !/^video\//.test(peek.ftype) && peek.ftype !== "application/octet-stream" ? `Your browser reports this file as "${peek.ftype}", not a video. Convert it to MP4.`
      : "The server looks fine. If your site was not redeployed after the last update, redeploy it (the old build only allowed 30 MB and MP4/WebM/MOV).";
    return NextResponse.json({ why });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) return NextResponse.json({ error: "Video upload needs Vercel Blob. Add a Blob store in Vercel (Storage tab) and redeploy." }, { status: 501 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  try {
    const json = await handleUpload({
      body, request: req,
      onBeforeGenerateToken: async () => {
        if (!(await getAdmin())) throw new Error("Unauthorized");
        return { allowedContentTypes: ["video/*", "application/octet-stream"], maximumSizeInBytes: 200 * 1024 * 1024, addRandomSuffix: true, cacheControlMaxAge: 31536000 };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(json);
  } catch (e) { return NextResponse.json({ error: e.message || "Upload failed" }, { status: 400 }); }
}
