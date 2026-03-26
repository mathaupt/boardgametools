import { NextResponse } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/require-auth";
import { hash } from "bcryptjs";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";
import { validateString, firstError } from "@/lib/validation";

export const POST = withApiLogging(async function POST(request: Request) {
  try {
    const { userId: _userId } = await requireAdmin();

    const { name, email, password, role } = await request.json();

    const validationError = firstError(
      validateString(name, "name", { min: 1, max: 100 }),
      validateString(email, "email", { min: 1, max: 254 }),
      validateString(password, "password", { min: 8, max: 100 })
    );
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });
    if (role && !["USER", "ADMIN"].includes(role)) {
      return NextResponse.json({ error: "Ungültige Rolle" }, { status: 400 });
    }

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 409 });
    }

    // Create new user
    const passwordHash = await hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: role || "USER",
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    return handleApiError(error);
  }
});
