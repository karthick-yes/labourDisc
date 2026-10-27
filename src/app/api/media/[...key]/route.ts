import { getContractor } from "@/lib/auth/session";
import { isPublicMedia } from "@/lib/data/workers";
import { mediaUrl, storage } from "@/lib/storage";

// Serves stored media. Keys start with the owning contractor's id, so the
// owner can always see their files. Anyone else gets a file only if it is a
// worker photo or skill video with consent and a live public profile link.
export async function GET(req: Request, ctx: RouteContext<"/api/media/[...key]">) {
  const { key: parts } = await ctx.params;
  const key = parts.join("/");
  const contractor = await getContractor();
  const isOwner = contractor && key.startsWith(`${contractor.id}/`);
  if (!isOwner && !(await isPublicMedia(mediaUrl(key)))) {
    return new Response("Not found", { status: 404 });
  }

  const obj = await storage.get(key);
  if (!obj) return new Response("Not found", { status: 404 });
  const headers: Record<string, string> = {
    "Content-Type": obj.contentType,
    // Keys are random and never reused, so the bytes never change.
    "Cache-Control": isOwner ? "private, max-age=31536000, immutable" : "public, max-age=3600",
    "X-Robots-Tag": "noindex",
    "Accept-Ranges": "bytes",
  };
  // Phones request video in byte ranges.
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("range") ?? "");
  if (range) {
    const size = obj.body.length;
    const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start >= size || start > end) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    return new Response(new Uint8Array(obj.body.subarray(start, end + 1)), {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }
  return new Response(new Uint8Array(obj.body), { headers });
}
