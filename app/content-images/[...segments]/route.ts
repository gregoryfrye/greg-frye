import fs from "fs";
import path from "path";

// Serves images that live alongside case study content in /content
// (outside /public) so next/image can reference them by URL.
const CONTENT_DIR = path.join(process.cwd(), "content");

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ segments: string[] }> },
) {
  const { segments } = await params;

  // Folders starting with "_" (e.g. images/_/ raw selects) are source
  // material, not published content — never serve them.
  if (segments.some((segment) => segment.includes("..") || segment.startsWith("_"))) {
    return new Response("Not found", { status: 404 });
  }

  const filePath = path.join(CONTENT_DIR, ...segments);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext];

  if (!contentType || !filePath.startsWith(CONTENT_DIR) || !fs.existsSync(filePath)) {
    return new Response("Not found", { status: 404 });
  }

  const file = fs.readFileSync(filePath);
  return new Response(new Uint8Array(file), {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
