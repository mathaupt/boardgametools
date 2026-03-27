import { NextResponse } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/require-auth";
import { readFileSync } from "fs";
import path from "path";

export async function GET() {
  try {
    await requireAdmin();
    const filePath = path.join(process.cwd(), "docs", "openapi.yaml");
    const content = readFileSync(filePath, "utf-8");
    return new NextResponse(content, {
      headers: { "Content-Type": "text/yaml; charset=utf-8" },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
