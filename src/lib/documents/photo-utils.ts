import { readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./uploads";

export async function photoToDataUri(photoPath: string | null | undefined): Promise<string | null> {
  if (!photoPath) return null;
  try {
    const base = path.resolve(UPLOAD_DIR);
    const fullPath = path.resolve(base, photoPath);
    if (!fullPath.startsWith(base + path.sep) && fullPath !== base) return null;
    const buf = await readFile(fullPath);
    // @react-pdf/renderer does not support WebP — always convert to JPEG
    const jpegBuf = await sharp(buf).jpeg({ quality: 85 }).toBuffer();
    return `data:image/jpeg;base64,${jpegBuf.toString("base64")}`;
  } catch {
    return null;
  }
}
