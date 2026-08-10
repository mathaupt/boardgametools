import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { apiAuth } from "@/lib/api-auth";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";
import { compare, hash } from "bcryptjs";
import { firstError, validateString } from "@/lib/validation";

export const GET = withApiLogging(async function GET(request: NextRequest) {
  try {
    const session = await apiAuth(request);
    if (!session) {
      throw new ApiError(401, Errors.UNAUTHORIZED);
    }

    const [ownedGames, sessions, events, groups] = await prisma.$transaction([
      prisma.game.count({ where: { ownerId: session.user.id, deletedAt: null } }),
      prisma.gameSession.count({ where: { createdById: session.user.id } }),
      prisma.event.count({ where: { createdById: session.user.id } }),
      prisma.group.count({ where: { ownerId: session.user.id } }),
    ]);

    return NextResponse.json({
      user: session.user,
      totals: { ownedGames, sessions, events, groups },
    });
  } catch (error) {
    return handleApiError(error);
  }
});

export const PUT = withApiLogging(async function PUT(request: NextRequest) {
  try {
    const session = await apiAuth(request);
    if (!session) {
      throw new ApiError(401, Errors.UNAUTHORIZED);
    }

    const body = await request.json();
    const { name, currentPassword, newPassword } = body;

    const validationError = firstError(
      validateString(name, "name", { required: false, max: 100 }),
      validateString(currentPassword, "currentPassword", { required: false }),
      validateString(newPassword, "newPassword", { required: false, min: 8, max: 128 })
    );
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: Errors.USER_NOT_FOUND }, { status: 404 });
    }

    const updateData: { name?: string; passwordHash?: string } = {};

    if (typeof name === "string" && name.trim() !== "" && name !== user.name) {
      updateData.name = name.trim();
    }

    if (typeof newPassword === "string" && newPassword.length > 0) {
      if (typeof currentPassword !== "string" || currentPassword.length === 0) {
        return NextResponse.json({ error: "Aktuelles Passwort erforderlich" }, { status: 400 });
      }
      const isValid = await compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: "Aktuelles Passwort ist falsch" }, { status: 403 });
      }
      if (newPassword.length < 8) {
        return NextResponse.json({ error: Errors.PASSWORD_MIN_LENGTH }, { status: 400 });
      }
      updateData.passwordHash = await hash(newPassword, 12);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: { id: true, email: true, name: true, role: true },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    return handleApiError(error);
  }
});

export const PATCH = PUT;
