import { NextRequest } from "next/server";
import sharp from "sharp";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { randomUUID } from "crypto";

const UPLOAD_DIR = join(process.cwd(), "uploads");
const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];

export async function POST(request: NextRequest) {
  if (!existsSync(UPLOAD_DIR)) await mkdir(UPLOAD_DIR, { recursive: true });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) return Response.json({ error: "No file uploaded" }, { status: 400 });

  // Validate type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json({ error: "Tipe file tidak didukung. Gunakan JPG, PNG, WebP, GIF, atau PDF." }, { status: 400 });
  }

  // Validate size
  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ error: "File terlalu besar. Maksimal 1MB." }, { status: 400 });
  }

  const ext = file.type === "application/pdf" ? "pdf" : "webp";
  const filename = `${randomUUID()}.${ext}`;
  const filepath = join(UPLOAD_DIR, filename);

  const buffer = Buffer.from(await file.arrayBuffer());

  if (file.type === "application/pdf") {
    // PDF: save as-is (already validated size <= 1MB)
    await writeFile(filepath, buffer);
  } else {
    // Image: compress with sharp
    const compressed = await sharp(buffer)
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
    await writeFile(filepath, compressed);
  }

  return Response.json({
    filename,
    path: `/api/uploads/${filename}`,
    type: file.type.startsWith("image/") ? "IMAGE" : "DOCUMENT",
    originalName: file.name,
    size: file.type === "application/pdf" ? file.size : 0,
  });
}
