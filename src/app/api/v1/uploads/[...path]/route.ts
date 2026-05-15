import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { getSession } from "@/lib/auth/helpers";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./uploads";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });

  const { path: segments } = await params;
  const relativePath = segments.join("/");

  // Prevent path traversal
  const base = path.resolve(UPLOAD_DIR);
  const safePath = path.resolve(base, relativePath);
  if (!safePath.startsWith(base + path.sep) && safePath !== base) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  try {
    const file = await readFile(safePath);
    const ext = path.extname(relativePath).toLowerCase();
    const contentType =
      ext === ".webp" ? "image/webp"
      : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg"
      : ext === ".png" ? "image/png"
      : "application/octet-stream";

    return new Response(file, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ message: "File not found" }, { status: 404 });
  }
}
