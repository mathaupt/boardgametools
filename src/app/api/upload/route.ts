import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";
import { storage, generateFileName } from "@/lib/storage";
import { Errors } from "@/lib/error-messages";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

export const POST = withApiLogging(async function POST(request: NextRequest) {
  const { userId } = await requireAuth();

  try {
    const formData = await request.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: Errors.NO_IMAGE_FILE }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: Errors.INVALID_FILE_TYPE(ALLOWED_TYPES.join(", ")) },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: Errors.FILE_TOO_LARGE(MAX_SIZE / 1024 / 1024) },
        { status: 400 }
      );
    }

    // Upload via storage provider (local or blob)
    const fileName = generateFileName(file.name);
    const bytes = await file.arrayBuffer();
    const result = await storage.upload(Buffer.from(bytes), fileName, file.type);

    // Store metadata in DB
    const upload = await prisma.upload.create({
      data: {
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        storagePath: result.storagePath,
        ownerId: userId,
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
