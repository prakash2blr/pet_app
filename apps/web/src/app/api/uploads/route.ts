import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_IMAGES = 4;
const MAX_VIDEOS = 1;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 60 * 1024 * 1024;

const extensionByType: Record<string, string> = {
  "image/avif": ".avif",
  "image/gif": ".gif",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "video/mp4": ".mp4",
  "video/ogg": ".ogg",
  "video/quicktime": ".mov",
  "video/webm": ".webm",
  "video/x-m4v": ".m4v"
};

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const files = formData.getAll("files").filter((value): value is File => value instanceof File);
  const images = files.filter((file) => file.type.startsWith("image/"));
  const videos = files.filter((file) => file.type.startsWith("video/"));

  if (!files.length) {
    return NextResponse.json({ error: "No files were uploaded." }, { status: 400 });
  }

  if (files.length !== images.length + videos.length) {
    return NextResponse.json({ error: "Only image and video files are allowed." }, { status: 400 });
  }

  if (images.length > 0 && videos.length > 0) {
    return NextResponse.json({ error: "Upload either up to 4 images or 1 video, not both." }, { status: 400 });
  }

  if (images.length > MAX_IMAGES || videos.length > MAX_VIDEOS) {
    return NextResponse.json({ error: "Upload up to 4 images or 1 video." }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  try {
    const uploaded = await Promise.all(
      files.map(async (file) => {
        const kind = file.type.startsWith("video/") ? "video" : "image";
        const maxSize = kind === "video" ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;

        if (file.size > maxSize) {
          throw new UploadError(`${file.name} is too large for upload.`);
        }

        const extension = extensionByType[file.type] || path.extname(file.name).toLowerCase();
        const safeName = sanitizeFileName(file.name.replace(/\.[^.]+$/, "")) || "upload";
        const fileName = `${Date.now()}-${randomUUID()}-${safeName}${extension}`;
        const arrayBuffer = await file.arrayBuffer();

        await writeFile(path.join(uploadDir, fileName), Buffer.from(arrayBuffer));

        return {
          name: file.name,
          type: file.type,
          size: file.size,
          kind,
          url: `/uploads/${fileName}`
        };
      })
    );

    return NextResponse.json({ files: uploaded });
  } catch (error) {
    if (error instanceof UploadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
}

function sanitizeFileName(value: string) {
  return value.replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

class UploadError extends Error {}
