import "server-only";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { createId } from "@paralleldrive/cuid2";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./uploads";

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

type UploadOptions = {
  /** Subfolder under UPLOAD_DIR (e.g. "photos", "signatures") */
  folder: string;
  /** Max width in px for resizing. Defaults to 1200. */
  maxWidth?: number;
};

/**
 * Save an image upload to disk under UPLOAD_DIR/folder/.
 * Resizes to webp and returns the path relative to UPLOAD_DIR (e.g. "photos/abc.webp").
 */
export async function saveImage(file: File, opts: UploadOptions): Promise<string> {
  if (!IMAGE_MIME_TYPES.includes(file.type)) {
    throw new Error(`Unsupported image type: ${file.type}`);
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error(`Image too large (max ${MAX_IMAGE_BYTES / 1024 / 1024} MB)`);
  }

  const dir = path.join(UPLOAD_DIR, opts.folder);
  await mkdir(dir, { recursive: true });

  const filename = `${createId()}.webp`;
  const fullPath = path.join(dir, filename);

  const bytes = Buffer.from(await file.arrayBuffer());
  const processed = await sharp(bytes)
    .rotate()
    .resize({ width: opts.maxWidth ?? 1200, withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  await writeFile(fullPath, processed);

  return path.posix.join(opts.folder, filename);
}

/** Delete a previously uploaded file. Silently ignores missing files. */
export async function deleteUpload(relativePath: string): Promise<void> {
  if (!relativePath) return;
  try {
    await unlink(path.join(UPLOAD_DIR, relativePath));
  } catch {
    /* file already gone — ignore */
  }
}

/** Absolute filesystem path for a stored relative path. Used by the upload-serving route. */
export function resolveUploadPath(relativePath: string): string {
  return path.join(UPLOAD_DIR, relativePath);
}
