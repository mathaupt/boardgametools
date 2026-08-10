import "dotenv/config";
import { PrismaClient } from "../../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const TEST_USER = {
  email: "e2e@example.com",
  password: "E2ETest123!",
  name: "E2E Test User",
};

function createPrismaClient() {
  const databaseUrl = process.env.SQL_DATABASE_URL || process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Missing DATABASE_URL or SQL_DATABASE_URL for E2E bootstrap");
  }
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
}

module.exports = async function bootstrap() {
  const prisma = createPrismaClient();
  try {
    const existing = await prisma.user.findUnique({
      where: { email: TEST_USER.email },
    });

    if (!existing) {
      await prisma.user.create({
        data: {
          email: TEST_USER.email,
          name: TEST_USER.name,
          passwordHash: await hash(TEST_USER.password, 12),
          role: "USER",
          isActive: true,
        },
      });
      console.log(`[e2e bootstrap] Created test user ${TEST_USER.email}`);
    } else {
      await prisma.user.update({
        where: { email: TEST_USER.email },
        data: {
          isActive: true,
          passwordHash: await hash(TEST_USER.password, 12),
        },
      });
      console.log(`[e2e bootstrap] Updated test user ${TEST_USER.email}`);
    }
  } finally {
    await prisma.$disconnect();
  }
};
