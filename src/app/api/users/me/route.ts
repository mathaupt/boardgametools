import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { hash, compare } from "bcryptjs";
import { withApiLogging } from "@/lib/api-logger";
import { validateString, firstError } from "@/lib/validation";

export const GET = withApiLogging(async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
});

export const PUT = withApiLogging(async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, email, currentPassword, newPassword } = body;

    const validationError = firstError(
      validateString(name, "name", { required: false, max: 100 }),
      validateString(email, "email", { required: false, max: 254 }),
      validateString(newPassword, "newPassword", { required: false, min: 6, max: 100 })
    );
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build update data
    const updateData: { name?: string; email?: string; passwordHash?: string } = {};

    if (name && name !== user.name) {
      updateData.name = name;
    }

    if (email && email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: "E-Mail wird bereits verwendet" }, { status: 409 });
      }
      updateData.email = email;
    }

    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Aktuelles Passwort erforderlich" }, { status: 400 });
      }
      const isValid = await compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: "Aktuelles Passwort ist falsch" }, { status: 403 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "Neues Passwort muss mindestens 6 Zeichen haben" }, { status: 400 });
      }
      updateData.passwordHash = await hash(newPassword, 12);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ message: "Keine Änderungen" });
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
