import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";

export interface StorageResult {
  storagePath: string;
  publicUrl: string;
}

interface StorageProvider {
  upload(buffer: Buffer, fileName: string, mimeType: string): Promise<StorageResult>;
}

class LocalStorageProvider implements StorageProvider {
  async upload(buffer: Buffer, fileName: string): Promise<StorageResult> {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, fileName);
    await writeFile(filePath, buffer);
    return {
      storagePath: `uploads/${fileName}`,
      publicUrl: `/uploads/${fileName}`,
    };
  }
}

class BlobStorageProvider implements StorageProvider {
  async upload(buffer: Buffer, fileName: string, mimeType: string): Promise<StorageResult> {
    const { put } = await import("@vercel/blob");
    const blob = await put(fileName, buffer, {
      access: "public",
      contentType: mimeType,
    });
    return {
      storagePath: blob.pathname,
      publicUrl: blob.url,
    };
  }
}

function getStorageProvider(): StorageProvider {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    return new BlobStorageProvider();
  }
  return new LocalStorageProvider();
}

export function generateFileName(originalName: string): string {
  const ext = originalName.split(".").pop()?.toLowerCase() || "jpg";
  const hash = crypto.randomBytes(16).toString("hex");
  return `${hash}.${ext}`;
}

export const storage = getStorageProvider();
