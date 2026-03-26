import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { validateString, validateEmail, firstError } from "@/lib/validation";

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed, retryAfterMs } = checkRateLimit(`register:${ip}`, 5, 60_000);
    if (!allowed) return rateLimitResponse(retryAfterMs);

    const { email, password, name } = await request.json();

    const lengthError = firstError(
      validateString(name, "name", { min: 1, max: 100 }),
      validateString(password, "password", { min: 8, max: 100 }),
      validateEmail(email)
    );
    if (lengthError) return NextResponse.json({ error: lengthError }, { status: 400 });

    const normalizedEmail = (email as string).trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      // Generische Fehlermeldung → verhindert User-Enumeration
      return NextResponse.json(
        { error: "Registrierung fehlgeschlagen. Bitte versuche es erneut." },
        { status: 400 }
      );
    }

    const passwordHash = await hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: name.trim(),
      },
    });

    return NextResponse.json(
      { message: "User created successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
