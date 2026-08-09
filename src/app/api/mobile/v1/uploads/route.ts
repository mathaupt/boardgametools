import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";
import prisma from "@/lib/db";
import { storage, generateFileName } from "@/lib/storage";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024;

const MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xFF, 0xD8, 0xFF]],
  "image/png": [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  "image/gif": [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]],
};

function validateMagicBytes(buffer: Buffer, declaredType: string): boolean {
  const signatures = MAGIC_BYTES[declaredType];
  if (!signatures) return true;
  return signatures.some((sig) => sig.every((byte, i) => buffer.length > i && buffer[i] === byte));
}

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    const session = await apiAuth(request);
    if (!session) throw new ApiError(401, Errors.UNAUTHORIZED);

    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: Errors.NO_IMAGE_FILE }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: Errors.INVALID_FILE_TYPE(ALLOWED_TYPES.join(", ")) }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: Errors.FILE_TOO_LARGE(MAX_SIZE / 1024 / 1024) }, { status: 400 });
    }

    const fileName = generateFileName(file.name);
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (!validateMagicBytes(buffer, file.type)) {
      return NextResponse.json({ error: Errors.INVALID_MIME_TYPE }, { status: 400 });
    }

    const result = await storage.upload(buffer, fileName, file.type);

    const upload = await prisma.upload.create({
      data: {
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        storagePath: result.storagePath,
        ownerId: session.user.id,
      },
    });

    return NextResponse.json(
      {
        id: upload.id,
        url: result.publicUrl,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
});
