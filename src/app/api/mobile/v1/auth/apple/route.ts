import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { createTokenPair } from "@/lib/token-service";
import { verifyAppleIdentityToken } from "@/lib/apple-auth";
import { validateString } from "@/lib/validation";

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identityToken = body?.identityToken;
    const authorizationCode = body?.authorizationCode;
    const name = body?.name ? String(body.name).trim() : undefined;
    const deviceName = body?.deviceName ? String(body.deviceName).trim() : "iOS App";

    if (!identityToken || typeof identityToken !== "string") {
      return NextResponse.json({ error: "Apple Identity Token erforderlich" }, { status: 400 });
    }
    if (!authorizationCode || typeof authorizationCode !== "string") {
      return NextResponse.json({ error: "Apple Authorization Code erforderlich" }, { status: 400 });
    }

    const { sub, email, emailVerified } = await verifyAppleIdentityToken(identityToken);

    // Try to find an existing user by appleSub or verified email
    let user = await prisma.user.findUnique({ where: { appleSub: sub } });

    if (!user && email && emailVerified) {
      user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        await prisma.user.update({ where: { id: user.id }, data: { appleSub: sub } });
      }
    }

    if (!user) {
      if (!email) {
        return NextResponse.json({ error: "E-Mail für neue Apple-Anmeldung erforderlich" }, { status: 400 });
      }
      const nameError = name ? validateString(name, "Name", { max: 200 }) : null;
      if (nameError) return NextResponse.json({ error: nameError }, { status: 400 });

      const emailError = validateString(email, "E-Mail", { max: 200 });
      if (emailError) return NextResponse.json({ error: emailError }, { status: 400 });

      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split("@")[0],
          appleSub: sub,
          isActive: true,
          role: "USER",
          passwordHash: "", // Apple users have no local password
        },
      });
    }

    if (!user.isActive) {
      throw new ApiError(401, "Konto deaktiviert");
    }

    const tokens = await createTokenPair(user.id, deviceName);

    return NextResponse.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt.toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
});
